import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  buildAvailabilityUrl,
  parseDivisionMonthAvailability,
  parseInyoAvailability,
  SourceResponseError
} from "../workers/permit-poller/adapters.js";
import { getPermitProduct, publicPermitCatalog } from "../workers/permit-poller/catalog.js";
import {
  crossesPartyThreshold,
  hashToken,
  maskPhone,
  validateTrackerInput
} from "../workers/permit-poller/service.js";
import { handleHttp } from "../workers/permit-poller/worker.js";

const fixture = async (name) => JSON.parse(await readFile(
  new URL(`./fixtures/permit-poller/${name}`, import.meta.url), "utf8"
));

test("Whitney parser keeps Day Use and Overnight inventory separate", async () => {
  const payload = await fixture("inyo-availability.json");
  const dates = ["2026-07-20", "2026-07-21", "2026-07-22"];
  const dayUse = parseInyoAvailability(payload, getPermitProduct("rec_gov_445860_day_use"), dates);
  const overnight = parseInyoAvailability(payload, getPermitProduct("rec_gov_445860_overnight"), dates);
  assert.deepEqual(dayUse, [
    { date: "2026-07-20", remaining: 5 },
    { date: "2026-07-21", remaining: 1 }
  ]);
  assert.deepEqual(overnight, [
    { date: "2026-07-20", remaining: 2 },
    { date: "2026-07-21", remaining: 0 }
  ]);
});

test("missing Inyo dates remain unknown rather than becoming false zeroes", async () => {
  const payload = await fixture("inyo-availability.json");
  const records = parseInyoAvailability(
    payload,
    getPermitProduct("rec_gov_445860_day_use"),
    ["2026-08-01"]
  );
  assert.deepEqual(records, []);
});

test("Lost Coast parser reads the verified King Range division", () => {
  const records = parseInyoAvailability({
    payload: {
      "2026-09-10": {
        "445864001": {
          quota_usage_by_member_daily: { total: 57, remaining: 3 },
          is_walkup: false
        }
      }
    }
  }, getPermitProduct("rec_gov_445864_overnight"), ["2026-09-10"]);
  assert.deepEqual(records, [{ date: "2026-09-10", remaining: 3 }]);
});

test("Half Dome parser reads only the Daily division", async () => {
  const payload = await fixture("division-availability.json");
  const records = parseDivisionMonthAvailability(
    payload,
    getPermitProduct("rec_gov_234652_daily"),
    ["2026-07-20", "2026-07-21", "2026-07-22"]
  );
  assert.deepEqual(records, [
    { date: "2026-07-20", remaining: 3 },
    { date: "2026-07-21", remaining: 0 }
  ]);
});

test("adapter rejects schema drift instead of erasing the last known snapshot", () => {
  assert.throws(
    () => parseDivisionMonthAvailability(
      { payload: { availability: {} } },
      getPermitProduct("rec_gov_234652_daily"),
      ["2026-07-20"]
    ),
    (error) => error instanceof SourceResponseError && error.code === "division_missing"
  );
});

test("party thresholds trigger only when inventory becomes sufficient", () => {
  assert.equal(crossesPartyThreshold(0, 3, 1), true);
  assert.equal(crossesPartyThreshold(0, 3, 3), true);
  assert.equal(crossesPartyThreshold(0, 3, 4), false);
  assert.equal(crossesPartyThreshold(2, 3, 2), false);
  assert.equal(crossesPartyThreshold(3, 3, 3), false);
  assert.equal(crossesPartyThreshold(null, 3, 1), false);
});

test("tracker validation normalizes dates and enforces consent and product limits", () => {
  const now = new Date("2026-07-19T12:00:00.000Z");
  const valid = validateTrackerInput({
    phone: "+19515550123",
    permit_id: "rec_gov_445860_day_use",
    party_size: 2,
    dates: ["2026-07-21", "2026-07-20", "2026-07-21"],
    consent: true
  }, now);
  assert.equal(valid.ok, true);
  assert.deepEqual(valid.value.dates, ["2026-07-20", "2026-07-21"]);

  assert.equal(validateTrackerInput({ ...valid.value, consent: false }, now).ok, false);
  assert.equal(validateTrackerInput({ ...valid.value, consent: true, party_size: 16 }, now).ok, false);
  assert.equal(validateTrackerInput({ ...valid.value, consent: true, dates: ["2026-07-18"] }, now).ok, false);
  assert.equal(validateTrackerInput({
    ...valid.value,
    permit_id: "rec_gov_445864_overnight",
    party_size: 4,
    consent: true
  }, now).ok, false);
});

test("catalog exposes only verified cancellation-inventory products", () => {
  assert.deepEqual(publicPermitCatalog().map((product) => product.id), [
    "rec_gov_445860_day_use",
    "rec_gov_445860_overnight",
    "rec_gov_234652_daily",
    "rec_gov_445864_overnight"
  ]);
  assert.match(
    publicPermitCatalog().find((product) => product.id === "rec_gov_445864_overnight").safety_notice,
    /Check tides/
  );
});

test("adapter URLs use the correct Recreation.gov API family", () => {
  assert.match(
    buildAvailabilityUrl(getPermitProduct("rec_gov_445860_overnight"), "2026-07-01"),
    /permitinyo\/445860\/availabilityv2\?start_date=2026-07-01&end_date=2026-07-31/
  );
  assert.match(
    buildAvailabilityUrl(getPermitProduct("rec_gov_234652_daily"), "2026-07-01"),
    /api\/permits\/234652\/availability\/month/
  );
  assert.match(
    buildAvailabilityUrl(getPermitProduct("rec_gov_445864_overnight"), "2026-09-01"),
    /permitinyo\/445864\/availabilityv2\?start_date=2026-09-01&end_date=2026-09-30/
  );
});

test("management tokens hash deterministically and phone responses stay masked", async () => {
  assert.equal(await hashToken("token-a"), await hashToken("token-a"));
  assert.notEqual(await hashToken("token-a"), await hashToken("token-b"));
  assert.equal(maskPhone("+19515550123"), "+1******0123");
});

test("HTTP catalog is no-store and rejects unapproved browser origins", async () => {
  const env = { ALLOWED_ORIGINS: "https://www.trailgenic.com" };
  const ok = await handleHttp(new Request("https://alerts.trailgenic.com/permits", {
    headers: { Origin: "https://www.trailgenic.com" }
  }), env);
  assert.equal(ok.status, 200);
  assert.equal(ok.headers.get("Cache-Control"), "no-store");
  assert.equal(ok.headers.get("Access-Control-Allow-Origin"), "https://www.trailgenic.com");

  const bad = await handleHttp(new Request("https://alerts.trailgenic.com/permits", {
    headers: { Origin: "https://evil.example" }
  }), env);
  assert.equal(bad.status, 403);
});

test("public signup and compliance pages are served by the alerts Worker", async () => {
  const env = { ALLOWED_ORIGINS: "https://alerts.trailgenic.com", TURNSTILE_SITE_KEY: "0x_test" };
  const signup = await handleHttp(new Request("https://alerts.trailgenic.com/"), env);
  assert.equal(signup.status, 200);
  const signupBody = await signup.text();
  assert.match(signupBody, /TrailGenic Permit Alert SMS messages/);
  assert.match(signupBody, /0x_test/);
  assert.match(signupBody, /id="turnstile-widget"/);
  assert.doesNotMatch(signupBody, /id="turnstile"/);
  assert.match(signupBody, /typeof window\.turnstile\?\.render === "function"/);

  for (const path of ["/privacy", "/terms", "/help"]) {
    const response = await handleHttp(new Request(`https://alerts.trailgenic.com${path}`), env);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("Content-Type"), "text/html; charset=utf-8");
  }
  const help = await handleHttp(new Request("https://alerts.trailgenic.com/help"), env);
  assert.match(await help.text(), /START<\/strong> or <strong>UNSTOP/);
});
