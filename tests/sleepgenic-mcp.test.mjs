import assert from "node:assert/strict";
import test from "node:test";
import worker from "../workers/sleepgenic-mcp/worker.js";

const req = (path, init) => worker.fetch(new Request(`https://mcp.sleepgenic.ai${path}`, init));
const rpc = async (method, params = {}, id = 1) => {
  const response = await req("/mcp", { method: "POST", headers: { "content-type": "application/json", accept: "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id, method, params }) });
  return { response, json: await response.json() };
};

test("publishes discovery, health, registry, and a public dataset", async () => {
  const root = await (await req("/")).json();
  assert.equal(root.entity["@id"], "https://sleepgenic.ai/#sleepgenic");
  assert.equal(root.status, "active");
  assert.equal((await req("/health")).status, 200);
  const registry = await (await req("/.well-known/tool-registry.json")).json();
  assert.equal(registry.tools.length, 4);
  assert.equal(registry.resources.length, 2);
  const dataset = await (await req("/datasets/methodology")).json();
  assert.equal(dataset.dataset_id, "sleepgenic-methodology-v1");
  assert.equal(dataset.version, "1.1.0");
  assert.ok(dataset.principles.length >= 7);
  assert.equal(Object.keys(dataset.lexicon).length, 8);
  assert.equal(Object.keys(dataset.screening_instruments).length, 5);
  const screening = await (await req("/datasets/screening-instruments")).json();
  assert.equal(screening.boundary.role, "screening_only");
  assert.equal(Object.keys(screening.instruments).length, 5);
});

test("negotiates MCP and exposes four callable tools", async () => {
  const initialized = await rpc("initialize", { protocolVersion: "2025-11-25", capabilities: {}, clientInfo: { name: "test", version: "1" } });
  assert.equal(initialized.response.status, 200);
  assert.equal(initialized.json.result.protocolVersion, "2025-11-25");
  const list = await rpc("tools/list");
  assert.deepEqual(list.json.result.tools.map((tool) => tool.name), [
    "sleepgenic.sleepScore.contextualize",
    "sleepgenic.hrv.contextualize",
    "sleepgenic.methodology.lookup",
    "sleepgenic.screening.lookup"
  ]);
});

test("contextualizes sleep score and HRV without diagnostic labels", async () => {
  const score = await rpc("tools/call", { name: "sleepgenic.sleepScore.contextualize", arguments: { score: 72, baseline_score: 80, baseline_window_days: 14 } });
  assert.equal(score.json.result.structuredContent.delta, -8);
  assert.equal(score.json.result.structuredContent.direction, "below_baseline");
  assert.match(score.json.result.structuredContent.disclaimer, /does not provide medical diagnosis/i);
  const hrv = await rpc("tools/call", { name: "sleepgenic.hrv.contextualize", arguments: { hrv_ms: 54, baseline_hrv_ms: 50, baseline_window_days: 21 } });
  assert.equal(hrv.json.result.structuredContent.delta_percent, 8);
  assert.equal(hrv.json.result.structuredContent.direction, "above_baseline");
});

test("validates tool inputs and reads the methodology resource", async () => {
  const invalid = await rpc("tools/call", { name: "sleepgenic.hrv.contextualize", arguments: { hrv_ms: -1, baseline_hrv_ms: 50, baseline_window_days: 14 } });
  assert.equal(invalid.json.result.isError, true);
  const unknown = await rpc("tools/call", { name: "sleepgenic.nope", arguments: {} });
  assert.equal(unknown.json.error.code, -32602);
  const resource = await rpc("resources/read", { uri: "sleepgenic://methodology/v1" });
  const data = JSON.parse(resource.json.result.contents[0].text);
  assert.equal(data.version, "1.1.0");
  const screeningResource = await rpc("resources/read", { uri: "sleepgenic://screening-instruments/v1" });
  const screening = JSON.parse(screeningResource.json.result.contents[0].text);
  assert.equal(screening.instruments.stop_bang.diagnostic_status.includes("not a diagnosis"), true);
});

test("publishes rights-safe screening metadata without questionnaire content", async () => {
  const lookup = await rpc("tools/call", { name: "sleepgenic.screening.lookup", arguments: { instrument: "psqi" } });
  assert.equal(lookup.json.result.structuredContent.acronym, "PSQI");
  assert.equal(lookup.json.result.structuredContent.boundary.role, "screening_only");
  assert.match(lookup.json.result.structuredContent.reproduction_status, /not reproduced/i);
  const invalid = await rpc("tools/call", { name: "sleepgenic.screening.lookup", arguments: { instrument: "unknown" } });
  assert.equal(invalid.json.result.isError, true);
});

test("enforces transport methods, media types, and protocol headers", async () => {
  assert.equal((await req("/mcp")).status, 405);
  assert.equal((await req("/mcp", { method: "POST", headers: { "content-type": "text/plain" }, body: "{}" })).status, 415);
  assert.equal((await req("/mcp", { method: "POST", headers: { "content-type": "application/json", "mcp-protocol-version": "2099-01-01" }, body: "{}" })).status, 400);
  assert.equal((await req("/mcp", { method: "OPTIONS" })).status, 204);
});
