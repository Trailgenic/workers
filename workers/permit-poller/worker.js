const PERMITS = [
  { permit_id: "rec_gov_445860_day_use", name: "Mt. Whitney Day Use", rec_gov_facility_id: "445860", permit_type: "inyo", booking_url: "https://www.recreation.gov/permits/445860" },
  { permit_id: "rec_gov_445860_overnight", name: "Mt. Whitney Overnight", rec_gov_facility_id: "445860", permit_type: "inyo", booking_url: "https://www.recreation.gov/permits/445860" },
  { permit_id: "rec_gov_234652_day_use", name: "Half Dome Day Hike", rec_gov_facility_id: "234652", permit_type: "division", booking_url: "https://www.recreation.gov/permits/234652" },
  { permit_id: "rec_gov_233358_overnight", name: "Enchantments", rec_gov_facility_id: "233273", permit_type: "division", booking_url: "https://www.recreation.gov/permits/233273" },
  { permit_id: "rec_gov_4675310_spring", name: "Angels Landing Spring (Mar 1–May 31)", rec_gov_facility_id: "4675310", permit_type: "division", booking_url: "https://www.recreation.gov/permits/4675310" },
  { permit_id: "rec_gov_4675324_summer", name: "Angels Landing Summer (Jun 1–Aug 31)", rec_gov_facility_id: "4675324", permit_type: "division", booking_url: "https://www.recreation.gov/permits/4675324" },
  { permit_id: "rec_gov_4675325_fall", name: "Angels Landing Fall (Sep 1–Nov 30)", rec_gov_facility_id: "4675325", permit_type: "division", booking_url: "https://www.recreation.gov/permits/4675325" },
  { permit_id: "rec_gov_4675326_winter", name: "Angels Landing Winter (Dec 1–Feb 28)", rec_gov_facility_id: "4675326", permit_type: "division", booking_url: "https://www.recreation.gov/permits/4675326" },
  { permit_id: "rec_gov_445859_overnight", name: "John Muir Trail", rec_gov_facility_id: "445859", permit_type: "division", booking_url: "https://www.recreation.gov/permits/445859" },
  { permit_id: "rec_gov_234628_day_use", name: "The Wave (Coyote Buttes North)", rec_gov_facility_id: "274309", permit_type: "division", booking_url: "https://www.recreation.gov/permits/274309" },
  { permit_id: "rec_gov_445858_overnight", name: "Grand Canyon Rim-to-Rim Overnight", rec_gov_facility_id: "445858", permit_type: "division", booking_url: "https://www.recreation.gov/permits/445858" }
];

const jsonHeaders = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Cache-Control": "public, max-age=3600"
};

const phoneRegex = /^\+[1-9]\d{7,14}$/;
const BROWSER_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

const firstOfMonth = (date) => new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
const lastOfMonth = (date) => new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0));
const ymd = (d) => d.toISOString().slice(0, 10);

// Division permits (e.g. Half Dome): payload.availability.{division}.date_availability.{date}.remaining
const extractDivisionDates = (resp) => {
  const divisionMap = resp?.payload?.availability || {};
  const out = new Set();
  for (const division of Object.values(divisionMap)) {
    const dateAvail = division?.date_availability;
    if (!dateAvail || typeof dateAvail !== "object") continue;
    for (const [dateStr, slot] of Object.entries(dateAvail)) {
      if (slot && typeof slot.remaining === "number" && slot.remaining > 0) {
        out.add(dateStr.slice(0, 10));
      }
    }
  }
  return Array.from(out).sort();
};

// Inyo permits (e.g. Whitney): availabilityv2 payload shape not yet observed populated.
// Defensive recursive walk: collect any date-keyed node that exposes remaining>0 or an Available status.
const extractInyoDates = (resp) => {
  const payload = resp?.payload;
  const out = new Set();
  if (!payload || typeof payload !== "object") return [];
  const dateRe = /(\d{4}-\d{2}-\d{2})/;
  const walk = (node, inheritedDate) => {
    if (!node || typeof node !== "object") return;
    for (const [key, val] of Object.entries(node)) {
      const m = typeof key === "string" ? key.match(dateRe) : null;
      const dateForChild = m ? m[1] : inheritedDate;
      if (val && typeof val === "object") {
        const remaining =
          typeof val.remaining === "number" ? val.remaining :
          typeof val.remaining_count === "number" ? val.remaining_count :
          typeof val.total_remaining === "number" ? val.total_remaining : undefined;
        const isAvail = val.is_available === true || val.status === "Available";
        if (dateForChild && ((typeof remaining === "number" && remaining > 0) || isAvail)) {
          out.add(dateForChild);
        }
        walk(val, dateForChild);
      }
    }
  };
  walk(payload, null);
  return Array.from(out).sort();
};

const getPermitStateKey = (permitId) => `state:${permitId}`;
const getSubscriptionKey = (phone) => `sub:${phone}`;

const readJson = async (request) => {
  try { return await request.json(); } catch { return null; }
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
  const bodyPayload = new URLSearchParams({ To: to, From: fromNumber, Body: body });
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" },
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
      if (!raw) continue;
      try { subscriptions.push(JSON.parse(raw)); }
      catch { console.log(`Invalid subscription JSON at key ${key.name}`); }
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
    if (!sub.phone || !phoneRegex.test(sub.phone)) continue;
    await sendTwilioSMS(env, sub.phone, smsBody);
  }
};

const fetchPermitAvailability = async (permit, monthDate) => {
  const type = permit.permit_type || "division";
  let endpoint;
  if (type === "inyo") {
    const start = ymd(firstOfMonth(monthDate));
    const end = ymd(lastOfMonth(monthDate));
    endpoint = `https://www.recreation.gov/api/permitinyo/${permit.rec_gov_facility_id}/availabilityv2?start_date=${start}&end_date=${end}&commercial_acct=false`;
  } else {
    const startISO = firstOfMonth(monthDate).toISOString();
    endpoint = `https://www.recreation.gov/api/permits/${permit.rec_gov_facility_id}/availability/month?start_date=${encodeURIComponent(startISO)}`;
  }
  const res = await fetch(endpoint, { headers: { "Accept": "application/json", "User-Agent": BROWSER_UA } });
  if (!res.ok) {
    throw new Error(`Recreation.gov returned ${res.status} for ${permit.rec_gov_facility_id} (${type})`);
  }
  return await res.json();
};

const extractDates = (resp, permit) =>
  (permit.permit_type === "inyo") ? extractInyoDates(resp) : extractDivisionDates(resp);

const pollPermit = async (env, permit, now = new Date()) => {
  const thisMonth = firstOfMonth(now);
  const nextMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));

  let currentPayload, nextPayload;
  try {
    currentPayload = await fetchPermitAvailability(permit, thisMonth);
    nextPayload = await fetchPermitAvailability(permit, nextMonth);
  } catch (error) {
    console.log(`Failed availability check for ${permit.permit_id}: ${error.message}`);
    return { permit_id: permit.permit_id, status: "error", error: error.message };
  }

  // Log raw Inyo payloads when non-empty so we can confirm the populated shape from logs.
  if (permit.permit_type === "inyo") {
    const cp = JSON.stringify(currentPayload?.payload || {});
    if (cp.length > 2) console.log(`Inyo raw ${permit.permit_id} (current): ${cp.slice(0, 800)}`);
    const np = JSON.stringify(nextPayload?.payload || {});
    if (np.length > 2) console.log(`Inyo raw ${permit.permit_id} (next): ${np.slice(0, 800)}`);
  }

  const todayStr = new Date().toISOString().slice(0, 10);
  const combinedDates = Array.from(new Set([
    ...extractDates(currentPayload, permit),
    ...extractDates(nextPayload, permit)
  ])).filter((d) => d >= todayStr).sort();

  const stateKey = getPermitStateKey(permit.permit_id);
  const previousRaw = await env.PERMIT_STATE.get(stateKey);
  const isFirstRun = !previousRaw;
  const previousDates = previousRaw ? (JSON.parse(previousRaw).dates || []) : [];
  const previousDateSet = new Set(previousDates);
  const newDates = combinedDates.filter((d) => !previousDateSet.has(d));

  if (!isFirstRun && newDates.length > 0) {
    console.log(`New availability for ${permit.permit_id}: ${newDates.join(", ")}`);
    await notifySubscribers(env, permit, newDates);
  }

  await env.PERMIT_STATE.put(stateKey, JSON.stringify({
    permit_id: permit.permit_id,
    permit_type: permit.permit_type || "division",
    dates: combinedDates,
    updated_at: new Date().toISOString()
  }));

  return { permit_id: permit.permit_id, checked_dates: combinedDates.length, new_dates: newDates, status: "ok" };
};

const runPollCycle = async (env) => {
  const results = [];
  for (const permit of PERMITS) {
    results.push(await pollPermit(env, permit));
  }
  return results;
};

export default {
  async scheduled(_event, env, _ctx) {
    const results = await runPollCycle(env);
    console.log("Poll cycle complete:", JSON.stringify(results));
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
      return respond({
        entity: "TrailGenic",
        status: "healthy",
        poller_status: "operational",
        sms_status: "operational",
        kv_status: "operational",
        region: "global",
        infrastructure: { platform: "Cloudflare Workers", protocol: "WebMCP", agent_ready: true },
        last_checked: new Date().toISOString()
      }, 200, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*", "Cache-Control": "no-cache" });
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
      if (!data) return respond({ error: "Subscription not found." }, 404);
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
      if (!data) return respond({ permit_id: permitId, dates: [], status: "empty" }, 200);
      return respond(JSON.parse(data), 200);
    }

    return respond({ error: "Not found" }, 404);
  }
};
