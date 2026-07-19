import { fetchAvailability, SourceResponseError } from "./adapters.js";
import { getPermitProduct } from "./catalog.js";

const PHONE_RE = /^\+[1-9]\d{7,14}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const encoder = new TextEncoder();

const isoNow = (now = new Date()) => now.toISOString();
const dateOnly = (now = new Date()) => isoNow(now).slice(0, 10);

const resultRows = (result) => result?.results || [];
const changedRows = (result) => result?.meta?.changes || 0;

const validCalendarDate = (value) => {
  if (!DATE_RE.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
};

const addUtcDays = (date, days) => {
  const copy = new Date(date.getTime());
  copy.setUTCDate(copy.getUTCDate() + days);
  return copy;
};

export const validateTrackerInput = (body, now = new Date()) => {
  if (!body || typeof body !== "object") return { ok: false, error: "Request body must be JSON." };
  if (!PHONE_RE.test(body.phone || "")) return { ok: false, error: "phone must use E.164 format." };
  const product = getPermitProduct(body.permit_id);
  if (!product) return { ok: false, error: "Unknown or unsupported permit_id." };
  if (!Number.isInteger(body.party_size) || body.party_size < 1 || body.party_size > product.max_party_size) {
    return { ok: false, error: `party_size must be between 1 and ${product.max_party_size}.` };
  }
  if (!Array.isArray(body.dates) || body.dates.length < 1 || body.dates.length > 31) {
    return { ok: false, error: "dates must contain between 1 and 31 dates." };
  }
  if (body.consent !== true) return { ok: false, error: "Explicit SMS consent is required." };

  const today = dateOnly(now);
  const lastAllowed = dateOnly(addUtcDays(now, 366));
  const dates = [...new Set(body.dates)];
  if (dates.some((date) => !validCalendarDate(date) || date < today || date > lastAllowed)) {
    return { ok: false, error: `Each date must be valid and between ${today} and ${lastAllowed}.` };
  }
  dates.sort();
  return {
    ok: true,
    value: {
      phone: body.phone,
      permit_id: product.id,
      party_size: body.party_size,
      dates
    }
  };
};

const randomToken = () => {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/g, "");
};

export const hashToken = async (token) => {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(token));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
};

export const maskPhone = (phone) => {
  if (!PHONE_RE.test(phone || "")) return "redacted";
  return `${phone.slice(0, 2)}******${phone.slice(-4)}`;
};

export const crossesPartyThreshold = (previousRemaining, currentRemaining, partySize) =>
  Number.isInteger(previousRemaining) && previousRemaining < partySize && currentRemaining >= partySize;

const notificationText = ({ product, date, partySize, remaining }) => {
  const displayDate = new Intl.DateTimeFormat("en-US", {
    month: "short", day: "numeric", year: "numeric", timeZone: "UTC"
  }).format(new Date(`${date}T00:00:00.000Z`));
  return `TrailGenic Alert: ${remaining} spot${remaining === 1 ? "" : "s"} available for ${product.name} on ${displayDate}. Your party: ${partySize}. Book now: ${product.booking_url} Reply STOP to opt out.`;
};

const insertNotification = async (env, { eventId, trackerId, now = new Date() }) => {
  const notificationId = crypto.randomUUID();
  const createdAt = isoNow(now);
  const result = await env.DB.prepare(
    `INSERT OR IGNORE INTO notifications
      (id, event_id, tracker_id, status, attempts, created_at, updated_at)
     VALUES (?, ?, ?, 'queued', 0, ?, ?)`
  ).bind(notificationId, eventId, trackerId, createdAt, createdAt).run();

  if (changedRows(result) > 0) {
    await env.NOTIFICATION_QUEUE.send({ type: "notification", notification_id: notificationId });
    return notificationId;
  }
  return null;
};

const enqueueCurrentMatches = async (env, trackerId, permitId, partySize, dates, now = new Date()) => {
  if (!env.NOTIFICATION_QUEUE) return;
  for (const date of dates) {
    const snapshot = await env.DB.prepare(
      "SELECT remaining, observed_at FROM availability_snapshots WHERE permit_id = ? AND date = ?"
    ).bind(permitId, date).first();
    if (!snapshot || snapshot.remaining < partySize) continue;
    const eventId = `snapshot:${permitId}:${date}:${snapshot.observed_at}`;
    await env.DB.prepare(
      `INSERT OR IGNORE INTO availability_events
        (id, permit_id, date, previous_remaining, current_remaining, detected_at, event_type)
       VALUES (?, ?, ?, NULL, ?, ?, 'current_match')`
    ).bind(eventId, permitId, date, snapshot.remaining, isoNow(now)).run();
    await insertNotification(env, { eventId, trackerId, now });
  }
};

export const createTracker = async (env, input, now = new Date(), { status = "pending" } = {}) => {
  if (!new Set(["pending", "active"]).has(status)) throw new TypeError(`Invalid initial tracker status: ${status}`);
  const trackerId = crypto.randomUUID();
  const manageToken = randomToken();
  const tokenHash = await hashToken(manageToken);
  const timestamp = isoNow(now);
  const statements = [
    env.DB.prepare(
      `INSERT INTO trackers
        (id, manage_token_hash, phone_e164, permit_id, party_size, status, consent_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(trackerId, tokenHash, input.phone, input.permit_id, input.party_size, status, timestamp, timestamp, timestamp),
    ...input.dates.map((date) => env.DB.prepare(
      "INSERT INTO tracker_dates (tracker_id, date) VALUES (?, ?)"
    ).bind(trackerId, date))
  ];
  await env.DB.batch(statements);
  if (status === "active") {
    await enqueueCurrentMatches(env, trackerId, input.permit_id, input.party_size, input.dates, now);
  }
  return {
    id: trackerId,
    manage_token: manageToken,
    phone_masked: maskPhone(input.phone),
    permit_id: input.permit_id,
    party_size: input.party_size,
    dates: input.dates,
    status,
    created_at: timestamp
  };
};

const twilioVerifyRequest = async (env, path, form, fetchImpl = fetch) => {
  const { TWILIO_ACCOUNT_SID: accountSid, TWILIO_AUTH_TOKEN: authToken, TWILIO_VERIFY_SERVICE_SID: serviceSid } = env;
  if (!accountSid || !authToken || !serviceSid) throw new Error("Twilio Verify is not configured");
  const response = await fetchImpl(`https://verify.twilio.com/v2/Services/${serviceSid}/${path}`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${btoa(`${accountSid}:${authToken}`)}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams(form),
    signal: AbortSignal.timeout(15_000)
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`Twilio Verify returned ${response.status}: ${data.message || "request failed"}`);
  return data;
};

export const startPhoneVerification = async (env, phone, fetchImpl = fetch) => {
  if (!PHONE_RE.test(phone || "")) throw new TypeError("Invalid phone number");
  const result = await twilioVerifyRequest(env, "Verifications", { To: phone, Channel: "sms" }, fetchImpl);
  return { status: result.status || "pending" };
};

export const verifyTrackerPhone = async (env, token, code, { now = new Date(), fetchImpl = fetch } = {}) => {
  if (!/^\d{4,10}$/.test(code || "")) return { approved: false, reason: "invalid_code" };
  const tokenHash = await hashToken(token);
  const tracker = await env.DB.prepare(
    `SELECT id, phone_e164, permit_id, party_size, status FROM trackers WHERE manage_token_hash = ?`
  ).bind(tokenHash).first();
  if (!tracker || tracker.status === "cancelled") return { approved: false, reason: "not_found" };
  if (tracker.status === "active") return { approved: true, status: "active" };
  const result = await twilioVerifyRequest(env, "VerificationCheck", {
    To: tracker.phone_e164,
    Code: code
  }, fetchImpl);
  if (result.status !== "approved") return { approved: false, reason: result.status || "not_approved" };

  await env.DB.prepare(
    "UPDATE trackers SET status = 'active', updated_at = ? WHERE id = ? AND status = 'pending'"
  ).bind(isoNow(now), tracker.id).run();
  const dates = resultRows(await env.DB.prepare(
    "SELECT date FROM tracker_dates WHERE tracker_id = ? ORDER BY date"
  ).bind(tracker.id).all()).map((row) => row.date);
  await enqueueCurrentMatches(env, tracker.id, tracker.permit_id, tracker.party_size, dates, now);
  return { approved: true, status: "active" };
};

export const getTrackerByToken = async (env, token) => {
  const tokenHash = await hashToken(token);
  const tracker = await env.DB.prepare(
    `SELECT id, phone_e164, permit_id, party_size, status, created_at, updated_at
     FROM trackers WHERE manage_token_hash = ?`
  ).bind(tokenHash).first();
  if (!tracker) return null;
  const dates = resultRows(await env.DB.prepare(
    "SELECT date FROM tracker_dates WHERE tracker_id = ? ORDER BY date"
  ).bind(tracker.id).all()).map((row) => row.date);
  return {
    id: tracker.id,
    phone_masked: maskPhone(tracker.phone_e164),
    permit_id: tracker.permit_id,
    party_size: tracker.party_size,
    dates,
    status: tracker.status,
    created_at: tracker.created_at,
    updated_at: tracker.updated_at
  };
};

export const cancelTrackerByToken = async (env, token, now = new Date()) => {
  const tokenHash = await hashToken(token);
  const result = await env.DB.prepare(
    "UPDATE trackers SET status = 'cancelled', updated_at = ? WHERE manage_token_hash = ? AND status != 'cancelled'"
  ).bind(isoNow(now), tokenHash).run();
  return changedRows(result) > 0;
};

export const activePermitIds = async (env, now = new Date()) => {
  const rows = resultRows(await env.DB.prepare(
    `SELECT DISTINCT t.permit_id
     FROM trackers t JOIN tracker_dates d ON d.tracker_id = t.id
     WHERE t.status = 'active' AND d.date >= ?`
  ).bind(dateOnly(now)).all());
  return rows.map((row) => row.permit_id).filter((id) => getPermitProduct(id));
};

const activeDatesForPermit = async (env, permitId, now = new Date()) => {
  const rows = resultRows(await env.DB.prepare(
    `SELECT DISTINCT d.date
     FROM trackers t JOIN tracker_dates d ON d.tracker_id = t.id
     WHERE t.status = 'active' AND t.permit_id = ? AND d.date >= ?
     ORDER BY d.date`
  ).bind(permitId, dateOnly(now)).all());
  return rows.map((row) => row.date);
};

const groupDatesByMonth = (dates) => {
  const groups = new Map();
  for (const date of dates) {
    const month = `${date.slice(0, 7)}-01`;
    if (!groups.has(month)) groups.set(month, []);
    groups.get(month).push(date);
  }
  return groups;
};

const applyInventoryRecord = async (env, product, record, now = new Date()) => {
  const previous = await env.DB.prepare(
    "SELECT remaining FROM availability_snapshots WHERE permit_id = ? AND date = ?"
  ).bind(product.id, record.date).first();
  const observedAt = isoNow(now);
  await env.DB.prepare(
    `INSERT INTO availability_snapshots (permit_id, date, remaining, observed_at)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(permit_id, date) DO UPDATE SET remaining = excluded.remaining, observed_at = excluded.observed_at`
  ).bind(product.id, record.date, record.remaining, observedAt).run();

  // A tracker's first validated observation should alert when inventory is already
  // sufficient. Schema validation and exact date/product matching prevent floods.
  if ((!previous && record.remaining === 0) || (previous && record.remaining <= previous.remaining)) return 0;

  const previousRemaining = previous?.remaining ?? 0;

  const eventId = crypto.randomUUID();
  await env.DB.prepare(
    `INSERT INTO availability_events
      (id, permit_id, date, previous_remaining, current_remaining, detected_at, event_type)
     VALUES (?, ?, ?, ?, ?, ?, 'inventory_increase')`
  ).bind(eventId, product.id, record.date, previous ? previous.remaining : null, record.remaining, observedAt).run();

  const trackers = resultRows(await env.DB.prepare(
    `SELECT t.id
     FROM trackers t JOIN tracker_dates d ON d.tracker_id = t.id
     WHERE t.status = 'active' AND t.permit_id = ? AND d.date = ?
       AND t.party_size > ? AND t.party_size <= ?`
  ).bind(product.id, record.date, previousRemaining, record.remaining).all());

  let queued = 0;
  for (const tracker of trackers) {
    if (await insertNotification(env, { eventId, trackerId: tracker.id, now })) queued += 1;
  }
  return queued;
};

const startPollRun = async (env, product, now) => {
  const id = crypto.randomUUID();
  await env.DB.prepare(
    `INSERT INTO poll_runs (id, permit_id, status, started_at)
     VALUES (?, ?, 'running', ?)`
  ).bind(id, product.id, isoNow(now)).run();
  return id;
};

const finishPollRun = async (env, runId, fields, now) => {
  await env.DB.prepare(
    `UPDATE poll_runs SET status = ?, completed_at = ?, http_status = ?, inventory_count = ?,
      notifications_queued = ?, error_code = ?, error_message = ? WHERE id = ?`
  ).bind(
    fields.status,
    isoNow(now),
    fields.httpStatus ?? null,
    fields.inventoryCount ?? 0,
    fields.notificationsQueued ?? 0,
    fields.errorCode ?? null,
    fields.errorMessage?.slice(0, 500) ?? null,
    runId
  ).run();
};

export const pollPermit = async (env, permitId, {
  now = new Date(),
  fetchImpl = fetch
} = {}) => {
  const product = getPermitProduct(permitId);
  if (!product) throw new Error(`Unsupported permit: ${permitId}`);
  const runId = await startPollRun(env, product, now);
  let inventoryCount = 0;
  let notificationsQueued = 0;
  let lastHttpStatus = null;
  try {
    const dates = await activeDatesForPermit(env, permitId, now);
    for (const [month, monthDates] of groupDatesByMonth(dates)) {
      const result = await fetchAvailability(product, month, monthDates, fetchImpl);
      lastHttpStatus = result.httpStatus;
      inventoryCount += result.records.length;
      for (const record of result.records) {
        notificationsQueued += await applyInventoryRecord(env, product, record, now);
      }
    }
    await finishPollRun(env, runId, {
      status: "succeeded", httpStatus: lastHttpStatus,
      inventoryCount, notificationsQueued
    }, now);
    return { run_id: runId, permit_id: permitId, status: "succeeded", inventory_count: inventoryCount, notifications_queued: notificationsQueued };
  } catch (error) {
    await finishPollRun(env, runId, {
      status: "failed",
      httpStatus: error instanceof SourceResponseError ? error.httpStatus : lastHttpStatus,
      inventoryCount,
      notificationsQueued,
      errorCode: error instanceof SourceResponseError ? error.code : "unexpected_error",
      errorMessage: error.message
    }, now);
    throw error;
  }
};

const sendTwilioSms = async (env, to, body, fetchImpl = fetch) => {
  const { TWILIO_ACCOUNT_SID: accountSid, TWILIO_AUTH_TOKEN: authToken, TWILIO_FROM_NUMBER: from } = env;
  if (!accountSid || !authToken || !from) throw new Error("Twilio is not configured");
  const response = await fetchImpl(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${btoa(`${accountSid}:${authToken}`)}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({ To: to, From: from, Body: body }),
    signal: AbortSignal.timeout(15_000)
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`Twilio returned ${response.status}: ${data.message || "send failed"}`);
  return data.sid || null;
};

export const deliverNotification = async (env, notificationId, { now = new Date(), fetchImpl = fetch } = {}) => {
  const claimed = await env.DB.prepare(
    `UPDATE notifications SET status = 'sending', attempts = attempts + 1, updated_at = ?
     WHERE id = ? AND status IN ('queued', 'retry')`
  ).bind(isoNow(now), notificationId).run();
  if (changedRows(claimed) === 0) return { status: "skipped" };

  const row = await env.DB.prepare(
    `SELECT n.id, t.phone_e164, t.party_size, t.status AS tracker_status,
      e.permit_id, e.date, e.current_remaining
     FROM notifications n
     JOIN trackers t ON t.id = n.tracker_id
     JOIN availability_events e ON e.id = n.event_id
     WHERE n.id = ?`
  ).bind(notificationId).first();
  if (!row || row.tracker_status !== "active") {
    await env.DB.prepare(
      "UPDATE notifications SET status = 'cancelled', updated_at = ? WHERE id = ?"
    ).bind(isoNow(now), notificationId).run();
    return { status: "cancelled" };
  }
  const product = getPermitProduct(row.permit_id);
  if (!product) throw new Error(`Notification references unsupported permit: ${row.permit_id}`);
  const body = notificationText({
    product, date: row.date, partySize: row.party_size, remaining: row.current_remaining
  });
  try {
    const providerId = await sendTwilioSms(env, row.phone_e164, body, fetchImpl);
    await env.DB.prepare(
      `UPDATE notifications SET status = 'sent', provider_message_id = ?, sent_at = ?,
        updated_at = ?, last_error = NULL WHERE id = ?`
    ).bind(providerId, isoNow(now), isoNow(now), notificationId).run();
    return { status: "sent", provider_message_id: providerId };
  } catch (error) {
    await env.DB.prepare(
      `UPDATE notifications SET status = 'retry', last_error = ?, updated_at = ? WHERE id = ?`
    ).bind(error.message.slice(0, 500), isoNow(now), notificationId).run();
    throw error;
  }
};

export const healthSnapshot = async (env, now = new Date()) => {
  const active = await env.DB.prepare(
    "SELECT COUNT(*) AS count FROM trackers WHERE status = 'active'"
  ).first();
  const lastSuccess = await env.DB.prepare(
    "SELECT MAX(completed_at) AS completed_at FROM poll_runs WHERE status = 'succeeded'"
  ).first();
  const lastFailure = await env.DB.prepare(
    "SELECT permit_id, completed_at, error_code FROM poll_runs WHERE status = 'failed' ORDER BY completed_at DESC LIMIT 1"
  ).first();
  const activeCount = active?.count || 0;
  const lastSuccessAt = lastSuccess?.completed_at || null;
  const staleAfter = new Date(now.getTime() - 20 * 60 * 1000).toISOString();
  const pollerStatus = activeCount === 0 ? "idle" : lastSuccessAt && lastSuccessAt >= staleAfter ? "operational" : "degraded";
  return {
    status: pollerStatus === "degraded" ? "degraded" : "healthy",
    poller_status: pollerStatus,
    database_status: "operational",
    sms_status: env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN && env.TWILIO_FROM_NUMBER && env.TWILIO_VERIFY_SERVICE_SID ? "configured" : "not_configured",
    active_trackers: activeCount,
    last_success_at: lastSuccessAt,
    last_failure: lastFailure || null,
    checked_at: isoNow(now)
  };
};
