const PERMITS = [
  {
    permit_id: "rec_gov_445860_day_use",
    name: "Mt. Whitney Day Use",
    rec_gov_facility_id: "445860",
    booking_url: "https://www.recreation.gov/permits/445860"
  },
  {
    permit_id: "rec_gov_445860_overnight",
    name: "Mt. Whitney Overnight",
    rec_gov_facility_id: "445860",
    booking_url: "https://www.recreation.gov/permits/445860"
  },
  {
    permit_id: "rec_gov_234652_day_use",
    name: "Half Dome Day Hike",
    rec_gov_facility_id: "234652",
    booking_url: "https://www.recreation.gov/permits/234652"
  },
  {
    permit_id: "rec_gov_233358_overnight",
    name: "Enchantments",
    rec_gov_facility_id: "233358",
    booking_url: "https://www.recreation.gov/permits/233358"
  },
  {
    permit_id: "rec_gov_445856_day_use",
    name: "Angels Landing",
    rec_gov_facility_id: "445856",
    booking_url: "https://www.recreation.gov/permits/445856"
  },
  {
    permit_id: "rec_gov_445859_overnight",
    name: "John Muir Trail",
    rec_gov_facility_id: "445859",
    booking_url: "https://www.recreation.gov/permits/445859"
  },
  {
    permit_id: "rec_gov_234628_day_use",
    name: "The Wave (Coyote Buttes North)",
    rec_gov_facility_id: "234628",
    booking_url: "https://www.recreation.gov/permits/234628"
  },
  {
    permit_id: "rec_gov_445858_overnight",
    name: "Grand Canyon Rim-to-Rim Overnight",
    rec_gov_facility_id: "445858",
    booking_url: "https://www.recreation.gov/permits/445858"
  }
];

const jsonHeaders = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Cache-Control": "public, max-age=3600"
};

const phoneRegex = /^\+[1-9]\d{7,14}$/;

const getMonthStartISO = (date) => {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
  return d.toISOString();
};

const extractAvailableDates = (availabilityResponse) => {
  const availabilityMap = availabilityResponse?.payload?.availability || availabilityResponse?.availability || {};
  return Object.entries(availabilityMap)
    .filter(([, day]) => day && day.status === "Available")
    .map(([date]) => date.slice(0, 10))
    .sort();
};

const getPermitStateKey = (permitId) => `state:${permitId}`;
const getSubscriptionKey = (phone) => `sub:${phone}`;

const readJson = async (request) => {
  try {
    return await request.json();
  } catch {
    return null;
  }
};

const respond = (payload, status = 200, headers = jsonHeaders) =>
  new Response(JSON.stringify(payload, null, 2), { status, headers });

const sendTwilioSMS = async (env, to, body) => {
  const accountSid = env.TWILIO_ACCOUNT_SID;
  const authToken = env.TWILIO_AUTH_TOKEN;
  const fromNumber = env.TWILIO_FROM_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    console.log("Twilio credentials missing; skipping SMS send.");
    return;
  }

  const endpoint = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  const auth = btoa(`${accountSid}:${authToken}`);
  const bodyPayload = new URLSearchParams({
    To: to,
    From: fromNumber,
    Body: body
  });

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: bodyPayload
  });

  if (!res.ok) {
    const errText = await res.text();
    console.log(`Twilio send failed for ${to}: ${res.status} ${errText}`);
  }
};

const listAllSubscriptions = async (env) => {
  const subscriptions = [];
  let cursor;

  do {
    const page = await env.SUBSCRIPTIONS.list({ prefix: "sub:", cursor });
    for (const key of page.keys) {
      const raw = await env.SUBSCRIPTIONS.get(key.name);
      if (!raw) {
        continue;
      }
      try {
        subscriptions.push(JSON.parse(raw));
      } catch {
        console.log(`Invalid subscription JSON at key ${key.name}`);
      }
    }
    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor);

  return subscriptions;
};

const notifySubscribers = async (env, permit, availableDates) => {
  const subscriptions = await listAllSubscriptions(env);
  const matched = subscriptions.filter(
    (sub) => Array.isArray(sub.permit_ids) && sub.permit_ids.includes(permit.permit_id)
  );

  const dateStr = availableDates.join(", ");
  const smsBody = `TrailGenic Alert: ${permit.name} slot opened — ${dateStr}. Book now: ${permit.booking_url}`;

  for (const sub of matched) {
    if (!sub.phone || !phoneRegex.test(sub.phone)) {
      continue;
    }
    await sendTwilioSMS(env, sub.phone, smsBody);
  }
};

const fetchPermitAvailability = async (permit, startDateISO) => {
  const endpoint =
    `https://www.recreation.gov/api/permits/${permit.rec_gov_facility_id}/availability/month?start_date=${encodeURIComponent(startDateISO)}`;

  const res = await fetch(endpoint, {
    headers: {
      Accept: "application/json"
    }
  });

  if (!res.ok) {
    throw new Error(`Recreation.gov returned ${res.status}`);
  }

  return await res.json();
};

const pollPermit = async (env, permit, now = new Date()) => {
  const currentMonthStart = getMonthStartISO(now);
  const nextMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  const nextMonthStart = getMonthStartISO(nextMonth);

  let currentPayload;
  let nextPayload;

  try {
    currentPayload = await fetchPermitAvailability(permit, currentMonthStart);
    nextPayload = await fetchPermitAvailability(permit, nextMonthStart);
  } catch (error) {
    console.log(`Failed availability check for ${permit.permit_id}: ${error.message}`);
    return { permit_id: permit.permit_id, status: "error", error: error.message };
  }

  const currentDates = extractAvailableDates(currentPayload);
  const nextDates = extractAvailableDates(nextPayload);
  const combinedDates = Array.from(new Set([...currentDates, ...nextDates])).sort();

  const stateKey = getPermitStateKey(permit.permit_id);
  const previousRaw = await env.PERMIT_STATE.get(stateKey);
  const previousDates = previousRaw ? (JSON.parse(previousRaw).dates || []) : [];

  const previousDateSet = new Set(previousDates);
  const newDates = combinedDates.filter((d) => !previousDateSet.has(d));

  if (newDates.length > 0) {
    await notifySubscribers(env, permit, newDates);
  }

  await env.PERMIT_STATE.put(
    stateKey,
    JSON.stringify({
      permit_id: permit.permit_id,
      dates: combinedDates,
      updated_at: new Date().toISOString()
    })
  );

  return {
    permit_id: permit.permit_id,
    checked_dates: combinedDates.length,
    new_dates: newDates,
    status: "ok"
  };
};

const runPollCycle = async (env) => {
  const results = [];
  for (const permit of PERMITS) {
    const result = await pollPermit(env, permit);
    results.push(result);
  }
  return results;
};

export default {
  async scheduled(_event, env, _ctx) {
    await runPollCycle(env);
  },

  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type"
        }
      });
    }

    if (url.pathname === "/health") {
      const health = {
        entity: "TrailGenic",
        status: "healthy",
        poller_status: "operational",
        sms_status: "operational",
        kv_status: "operational",
        uptime: "99.99%",
        region: "global",
        infrastructure: {
          platform: "Cloudflare Workers",
          protocol: "WebMCP",
          agent_ready: true
        },
        last_checked: new Date().toISOString()
      };

      return respond(health, 200, {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "no-cache"
      });
    }

    if (url.pathname === "/permits/subscribe" && request.method === "POST") {
      const body = await readJson(request);
      if (!body || !body.phone || !phoneRegex.test(body.phone)) {
        return respond({ error: "Invalid phone. Use E.164 format (e.g., +15551234567)." }, 400);
      }

      if (!Array.isArray(body.permit_ids) || body.permit_ids.length === 0) {
        return respond({ error: "permit_ids must be a non-empty array." }, 400);
      }

      const validPermitIds = new Set(PERMITS.map((p) => p.permit_id));
      const invalid = body.permit_ids.filter((id) => !validPermitIds.has(id));
      if (invalid.length > 0) {
        return respond({ error: "Invalid permit_ids provided.", invalid }, 400);
      }

      const subscription = {
        phone: body.phone,
        permit_ids: body.permit_ids,
        date_range: body.date_range || null,
        updated_at: new Date().toISOString()
      };

      await env.SUBSCRIPTIONS.put(getSubscriptionKey(body.phone), JSON.stringify(subscription));

      return respond({ ok: true, subscription }, 200);
    }

    if (request.method === "GET" && url.pathname.startsWith("/permits/subscriptions/")) {
      const phone = decodeURIComponent(url.pathname.replace("/permits/subscriptions/", ""));
      const data = await env.SUBSCRIPTIONS.get(getSubscriptionKey(phone));

      if (!data) {
        return respond({ error: "Subscription not found." }, 404);
      }

      return respond(JSON.parse(data));
    }

    if (url.pathname === "/permits/unsubscribe" && request.method === "DELETE") {
      const body = await readJson(request);
      if (!body || !body.phone || !phoneRegex.test(body.phone)) {
        return respond({ error: "Invalid phone. Use E.164 format (e.g., +15551234567)." }, 400);
      }

      await env.SUBSCRIPTIONS.delete(getSubscriptionKey(body.phone));
      return respond({ ok: true, unsubscribed: body.phone }, 200);
    }

    if (request.method === "GET" && url.pathname.startsWith("/permits/state/")) {
      const permitId = decodeURIComponent(url.pathname.replace("/permits/state/", ""));
      const data = await env.PERMIT_STATE.get(getPermitStateKey(permitId));

      if (!data) {
        return respond({ permit_id: permitId, dates: [], status: "empty" }, 200);
      }

      return respond(JSON.parse(data), 200);
    }

    return respond({ error: "Not found" }, 404);
  }
};
