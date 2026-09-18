import { publicPermitCatalog } from "./catalog.js";
import {
  activePermitIds,
  cancelTrackerByToken,
  createTracker,
  deliverNotification,
  getTrackerByToken,
  healthSnapshot,
  pauseExpiredTrackers,
  pollPermit,
  startPhoneVerification,
  verifyTrackerPhone,
  validateTrackerInput
} from "./service.js";
import { publicPage } from "./public-site.js";

const JSON_TYPE = "application/json; charset=utf-8";

const allowedOrigins = (env) => new Set(
  (env.ALLOWED_ORIGINS || "https://trailgenic.com,https://www.trailgenic.com")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)
);

const corsHeaders = (request, env) => {
  const origin = request.headers.get("Origin");
  if (!origin || !allowedOrigins(env).has(origin)) return { Vary: "Origin" };
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Authorization,Content-Type",
    Vary: "Origin"
  };
};

const json = (request, env, body, status = 200) => new Response(JSON.stringify(body, null, 2), {
  status,
  headers: {
    "Content-Type": JSON_TYPE,
    "Cache-Control": "no-store",
    ...corsHeaders(request, env)
  }
});

const readJson = async (request) => {
  try { return await request.json(); }
  catch { return null; }
};

const bearerToken = (request) => {
  const value = request.headers.get("Authorization") || "";
  return value.startsWith("Bearer ") ? value.slice(7).trim() : null;
};

const verifyTurnstile = async (request, env, token) => {
  if (env.REQUIRE_TURNSTILE === "false") return true;
  if (!env.TURNSTILE_SECRET_KEY || !token) return false;
  const form = new FormData();
  form.set("secret", env.TURNSTILE_SECRET_KEY);
  form.set("response", token);
  const remoteIp = request.headers.get("CF-Connecting-IP");
  if (remoteIp) form.set("remoteip", remoteIp);
  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body: form,
    signal: AbortSignal.timeout(10_000)
  });
  if (!response.ok) return false;
  const result = await response.json();
  return result.success === true;
};

const handleHttp = async (request, env) => {
  const url = new URL(request.url);
  const origin = request.headers.get("Origin");
  if (origin && !allowedOrigins(env).has(origin)) {
    return json(request, env, { error: "Origin not allowed." }, 403);
  }

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(request, env) });
  }

  if (request.method === "GET") {
    const page = publicPage(url.pathname, env);
    if (page) {
      return new Response(page, {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "no-store",
          "X-Content-Type-Options": "nosniff",
          "Referrer-Policy": "strict-origin-when-cross-origin"
        }
      });
    }
  }

  if (request.method === "GET" && url.pathname === "/health") {
    try {
      const health = await healthSnapshot(env);
      return json(request, env, { entity: "TrailGenic", service: "permit-cancellation-alerts", ...health }, health.status === "healthy" ? 200 : 503);
    } catch (error) {
      return json(request, env, {
        entity: "TrailGenic",
        service: "permit-cancellation-alerts",
        status: "unhealthy",
        database_status: "unavailable",
        checked_at: new Date().toISOString(),
        error: error.message
      }, 503);
    }
  }

  if (request.method === "GET" && url.pathname === "/permits") {
    return json(request, env, { permits: publicPermitCatalog() });
  }

  if (request.method === "POST" && url.pathname === "/trackers") {
    const body = await readJson(request);
    if (!await verifyTurnstile(request, env, body?.turnstile_token)) {
      return json(request, env, { error: "Human verification failed." }, 403);
    }
    const validation = validateTrackerInput(body);
    if (!validation.ok) return json(request, env, { error: validation.error }, 400);
    const tracker = await createTracker(env, validation.value);
    try {
      await startPhoneVerification(env, validation.value.phone);
    } catch (error) {
      await cancelTrackerByToken(env, tracker.manage_token);
      throw error;
    }
    return json(request, env, {
      ok: true,
      tracker,
      management: {
        method: "Authorization: Bearer <manage_token>",
        endpoint: `${url.origin}/trackers/manage`
      }
    }, 201);
  }

  if (request.method === "POST" && url.pathname === "/trackers/verify") {
    const token = bearerToken(request);
    if (!token) return json(request, env, { error: "A tracker management token is required." }, 401);
    const body = await readJson(request);
    const verification = await verifyTrackerPhone(env, token, body?.code);
    return verification.approved
      ? json(request, env, { ok: true, status: "active" })
      : json(request, env, { error: "Verification code was not approved.", reason: verification.reason }, 400);
  }

  if (url.pathname === "/trackers/manage" && (request.method === "GET" || request.method === "DELETE")) {
    const token = bearerToken(request);
    if (!token) return json(request, env, { error: "A tracker management token is required." }, 401);
    if (request.method === "GET") {
      const tracker = await getTrackerByToken(env, token);
      return tracker ? json(request, env, { tracker }) : json(request, env, { error: "Tracker not found." }, 404);
    }
    const cancelled = await cancelTrackerByToken(env, token);
    return cancelled ? json(request, env, { ok: true }) : json(request, env, { error: "Active tracker not found." }, 404);
  }

  return json(request, env, { error: "Not found." }, 404);
};

const handlePollMessage = async (message, env) => {
  const permitId = message.body?.permit_id;
  if (message.body?.type !== "poll" || typeof permitId !== "string") {
    throw new Error("Invalid poll message");
  }
  return pollPermit(env, permitId);
};

const handleNotificationMessage = async (message, env) => {
  const notificationId = message.body?.notification_id;
  if (message.body?.type !== "notification" || typeof notificationId !== "string") {
    throw new Error("Invalid notification message");
  }
  return deliverNotification(env, notificationId);
};

export default {
  async fetch(request, env) {
    try {
      return await handleHttp(request, env);
    } catch (error) {
      console.error("Permit alert HTTP error", { name: error.name, message: error.message });
      return json(request, env, { error: "Internal service error." }, 500);
    }
  },

  async scheduled(_controller, env, ctx) {
    ctx.waitUntil((async () => {
      const paused = await pauseExpiredTrackers(env);
      if (paused > 0) console.log("Paused expired permit trackers", { tracker_count: paused });
      const permitIds = await activePermitIds(env);
      if (permitIds.length === 0) return;
      await env.POLL_QUEUE.sendBatch(permitIds.map((permitId) => ({
        body: { type: "poll", permit_id: permitId }
      })));
      console.log("Scheduled permit polls", { permit_count: permitIds.length });
    })());
  },

  async queue(batch, env) {
    const isNotificationQueue = batch.queue === "trailgenic-permit-notifications";
    for (const message of batch.messages) {
      try {
        if (isNotificationQueue) await handleNotificationMessage(message, env);
        else await handlePollMessage(message, env);
        message.ack();
      } catch (error) {
        console.error("Permit queue message failed", {
          queue: batch.queue,
          message_id: message.id,
          name: error.name,
          code: error.code || null,
          message: error.message
        });
        message.retry({ delaySeconds: 60 });
      }
    }
  }
};

export { handleHttp };
