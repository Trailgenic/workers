import { beforeEach, describe, expect, it } from "vitest";
import { env } from "cloudflare:test";
import migration from "../workers/permit-poller/migrations/0001_initial.sql?raw";
import {
  activePermitIds,
  cancelTrackerByToken,
  createTracker,
  deliverNotification,
  getTrackerByToken,
  healthSnapshot,
  pauseExpiredTrackers,
  pollPermit,
  verifyTrackerPhone
} from "../workers/permit-poller/service.js";

const resetDatabase = async () => {
  await env.DB.exec(`
    DROP TABLE IF EXISTS notifications;
    DROP TABLE IF EXISTS availability_events;
    DROP TABLE IF EXISTS availability_snapshots;
    DROP TABLE IF EXISTS tracker_dates;
    DROP TABLE IF EXISTS trackers;
    DROP TABLE IF EXISTS poll_runs;
  `);
  for (const statement of migration.split(";").map((part) => part.trim()).filter(Boolean)) {
    await env.DB.prepare(statement).run();
  }
};

const trackerInput = (partySize) => ({
  phone: partySize === 1 ? "+19515550101" : "+19515550102",
  permit_id: "rec_gov_445860_day_use",
  party_size: partySize,
  dates: ["2026-07-20"]
});

const inyoFetch = (remaining) => async () => new Response(JSON.stringify({
  payload: {
    "2026-07-20": {
      "406": {
        quota_usage_by_member_daily: { total: 100, remaining },
        is_walkup: false
      }
    }
  }
}), { status: 200, headers: { "Content-Type": "application/json" } });

describe("permit cancellation service with D1", () => {
  let queued;
  let serviceEnv;

  beforeEach(async () => {
    await resetDatabase();
    queued = [];
    serviceEnv = {
      DB: env.DB,
      NOTIFICATION_QUEUE: {
        send: async (body) => queued.push(body)
      }
    };
  });

  it("alerts only trackers whose party threshold was crossed", async () => {
    await createTracker(serviceEnv, trackerInput(1), new Date("2026-07-19T12:00:00Z"), { status: "active" });
    await createTracker(serviceEnv, trackerInput(2), new Date("2026-07-19T12:00:00Z"), { status: "active" });

    const first = await pollPermit(serviceEnv, "rec_gov_445860_day_use", {
      now: new Date("2026-07-19T12:05:00Z"),
      fetchImpl: inyoFetch(1)
    });
    expect(first.notifications_queued).toBe(1);
    expect(queued).toHaveLength(1);

    const second = await pollPermit(serviceEnv, "rec_gov_445860_day_use", {
      now: new Date("2026-07-19T12:10:00Z"),
      fetchImpl: inyoFetch(2)
    });
    expect(second.notifications_queued).toBe(1);
    expect(queued).toHaveLength(2);

    const unchanged = await pollPermit(serviceEnv, "rec_gov_445860_day_use", {
      now: new Date("2026-07-19T12:15:00Z"),
      fetchImpl: inyoFetch(2)
    });
    expect(unchanged.notifications_queued).toBe(0);
    expect(queued).toHaveLength(2);

    const notifications = await env.DB.prepare(
      "SELECT status FROM notifications ORDER BY created_at"
    ).all();
    expect(notifications.results.map((row) => row.status)).toEqual(["queued", "queued"]);
  });

  it("preserves the last good snapshot when the provider schema changes", async () => {
    await createTracker(serviceEnv, trackerInput(1), new Date("2026-07-19T12:00:00Z"), { status: "active" });
    await pollPermit(serviceEnv, "rec_gov_445860_day_use", {
      now: new Date("2026-07-19T12:05:00Z"),
      fetchImpl: inyoFetch(2)
    });
    queued.length = 0;

    await expect(pollPermit(serviceEnv, "rec_gov_445860_day_use", {
      now: new Date("2026-07-19T12:10:00Z"),
      fetchImpl: async () => new Response(JSON.stringify({ changed: true }), { status: 200 })
    })).rejects.toMatchObject({ code: "invalid_schema" });

    const snapshot = await env.DB.prepare(
      "SELECT remaining FROM availability_snapshots WHERE permit_id = ? AND date = ?"
    ).bind("rec_gov_445860_day_use", "2026-07-20").first();
    expect(snapshot.remaining).toBe(2);
    expect(queued).toHaveLength(0);
    const failed = await env.DB.prepare(
      "SELECT error_code FROM poll_runs WHERE status = 'failed' ORDER BY started_at DESC LIMIT 1"
    ).first();
    expect(failed.error_code).toBe("invalid_schema");
  });

  it("uses bearer management tokens without exposing the phone number", async () => {
    const created = await createTracker(serviceEnv, trackerInput(1), new Date("2026-07-19T12:00:00Z"));
    const tracker = await getTrackerByToken(serviceEnv, created.manage_token);
    expect(tracker.phone_masked).toBe("+1******0101");
    expect(tracker).not.toHaveProperty("phone_e164");
    expect(await cancelTrackerByToken(serviceEnv, created.manage_token)).toBe(true);
    expect((await getTrackerByToken(serviceEnv, created.manage_token)).status).toBe("cancelled");
  });

  it("keeps a tracker pending until Twilio Verify approves the phone", async () => {
    const created = await createTracker(serviceEnv, trackerInput(1), new Date("2026-07-19T12:00:00Z"));
    expect(created.status).toBe("pending");
    expect((await getTrackerByToken(serviceEnv, created.manage_token)).status).toBe("pending");
    const verifyEnv = {
      ...serviceEnv,
      TWILIO_ACCOUNT_SID: "AC_test",
      TWILIO_AUTH_TOKEN: "secret",
      TWILIO_VERIFY_SERVICE_SID: "VA_test"
    };
    const verified = await verifyTrackerPhone(verifyEnv, created.manage_token, "123456", {
      now: new Date("2026-07-19T12:01:00Z"),
      fetchImpl: async (_url, init) => {
        expect(init.body.get("Code")).toBe("123456");
        return new Response(JSON.stringify({ status: "approved" }), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        });
      }
    });
    expect(verified).toEqual({ approved: true, status: "active" });
    expect((await getTrackerByToken(serviceEnv, created.manage_token)).status).toBe("active");
  });

  it("delivers an idempotent Twilio message from the notification outbox", async () => {
    await createTracker(serviceEnv, trackerInput(1), new Date("2026-07-19T12:00:00Z"), { status: "active" });
    await pollPermit(serviceEnv, "rec_gov_445860_day_use", {
      now: new Date("2026-07-19T12:05:00Z"),
      fetchImpl: inyoFetch(2)
    });
    const notificationId = queued[0].notification_id;
    let sends = 0;
    let smsBody = "";
    const deliveryEnv = {
      ...serviceEnv,
      TWILIO_ACCOUNT_SID: "AC_test",
      TWILIO_AUTH_TOKEN: "secret",
      TWILIO_FROM_NUMBER: "+19515550999"
    };
    const sent = await deliverNotification(deliveryEnv, notificationId, {
      now: new Date("2026-07-19T12:06:00Z"),
      fetchImpl: async (_url, init) => {
        sends += 1;
        smsBody = init.body.get("Body");
        return new Response(JSON.stringify({ sid: "SM_test" }), {
          status: 201,
          headers: { "Content-Type": "application/json" }
        });
      }
    });
    expect(sent).toEqual({ status: "sent", provider_message_id: "SM_test" });
    expect(smsBody).toContain("2 spots available for Mt. Whitney Day Use");
    expect(smsBody).toContain("Your party: 1");

    const duplicate = await deliverNotification(deliveryEnv, notificationId, {
      fetchImpl: async () => { throw new Error("must not send twice"); }
    });
    expect(duplicate).toEqual({ status: "skipped" });
    expect(sends).toBe(1);
  });

  it("treats trackers with only expired dates as healthy idle and pauses them", async () => {
    const created = await createTracker(
      serviceEnv,
      trackerInput(1),
      new Date("2026-07-19T12:00:00Z"),
      { status: "active" }
    );
    const now = new Date("2026-07-21T12:00:00Z");

    expect(await activePermitIds(serviceEnv, now)).toEqual([]);
    expect(await healthSnapshot(serviceEnv, now)).toMatchObject({
      status: "healthy",
      poller_status: "idle",
      active_trackers: 0
    });
    expect(await pauseExpiredTrackers(serviceEnv, now)).toBe(1);
    expect((await getTrackerByToken(serviceEnv, created.manage_token)).status).toBe("paused");
  });

  it("pauses opted-out recipients without retrying Twilio error 21610", async () => {
    const created = await createTracker(
      serviceEnv,
      trackerInput(1),
      new Date("2026-07-19T12:00:00Z"),
      { status: "active" }
    );
    await pollPermit(serviceEnv, "rec_gov_445860_day_use", {
      now: new Date("2026-07-19T12:05:00Z"),
      fetchImpl: inyoFetch(2)
    });
    const notificationId = queued[0].notification_id;
    const result = await deliverNotification({
      ...serviceEnv,
      TWILIO_ACCOUNT_SID: "AC_test",
      TWILIO_AUTH_TOKEN: "secret",
      TWILIO_FROM_NUMBER: "+19515550999"
    }, notificationId, {
      now: new Date("2026-07-19T12:06:00Z"),
      fetchImpl: async () => new Response(JSON.stringify({
        code: 21610,
        message: "Attempt to send to unsubscribed recipient"
      }), { status: 400, headers: { "Content-Type": "application/json" } })
    });

    expect(result).toEqual({ status: "cancelled", reason: "recipient_opted_out" });
    expect((await getTrackerByToken(serviceEnv, created.manage_token)).status).toBe("paused");
    expect(await env.DB.prepare(
      "SELECT status FROM notifications WHERE id = ?"
    ).bind(notificationId).first()).toMatchObject({ status: "cancelled" });
  });
});
