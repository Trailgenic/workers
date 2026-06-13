const BASE = process.env.BASE || "https://mcp.trailgenic.com";

let nextId = 1;

const assert = (condition, message) => {
  if (!condition) {
    throw new Error(message);
  }
};

const postMcp = async (method, params = {}, extra = {}) => {
  const body = { jsonrpc: "2.0", id: nextId++, method, params, ...extra };
  const response = await fetch(`${BASE}/mcp`, {
    method: "POST",
    headers: { "content-type": "application/json", "mcp-protocol-version": "2025-06-18" },
    body: JSON.stringify(body)
  });
  const text = await response.text();
  const json = text ? JSON.parse(text) : null;
  return { response, json };
};

const getJson = async (path) => {
  const response = await fetch(`${BASE}${path}`);
  const json = await response.json();
  return { response, json };
};

const toolIdsFromList = (tools) => tools.map((tool) => tool.name ?? tool.id).sort();
const toolIdsFromInventory = (tools) => tools.map((tool) => tool.name ?? tool.id).sort();

console.log(`Running TrailGenic live acceptance against ${BASE}`);

const init = await postMcp("initialize", { protocolVersion: "2025-06-18" });
assert(init.response.ok, "initialize should return HTTP 2xx");
assert(init.json.result.serverInfo.name === "TrailGenic", "initialize serverInfo.name should be TrailGenic");
assert(init.response.headers.get("access-control-allow-origin") === "*", "initialize response should include CORS");

const initialized = await fetch(`${BASE}/mcp`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" })
});
assert(initialized.status === 202, "notifications/initialized should return HTTP 202");
assert(initialized.headers.get("access-control-allow-origin") === "*", "initialized response should include CORS");

const ping = await postMcp("ping");
assert(ping.response.ok && ping.json.result && Object.keys(ping.json.result).length === 0, "ping should return empty result");

const listed = await postMcp("tools/list");
const listIds = toolIdsFromList(listed.json.result.tools);
assert(listIds.length === 18, `tools/list should return 18 tools, got ${listIds.length}`);
assert(listIds.includes("tg.longevity.bioAge.compute"), "tools/list should include tg.longevity.bioAge.compute");
assert(listIds.includes("tg.gear.getIntel"), "tools/list should include tg.gear.getIntel");
for (const toolId of ["tg.conditioning.walking.get", "tg.conditioning.rucking.get", "tg.conditioning.running.get"]) {
  assert(listIds.includes(toolId), `tools/list should include ${toolId}`);
}

const indexCall = await postMcp("tools/call", { name: "tg.datasets.index.get", arguments: {} });
assert(indexCall.json.result.structuredContent.datasets?.length > 0, "tg.datasets.index.get should return catalog datasets");

const foundationCall = await postMcp("tools/call", { name: "tg.longevity.foundationSessions.get", arguments: {} });
assert(foundationCall.json.result.structuredContent.sessions?.length === 14, "foundation sessions tool should return 14 sessions");

const gearIntelDataset = await getJson("/datasets/gear/intel");
assert(gearIntelDataset.response.ok, "/datasets/gear/intel should return JSON");
assert(
  gearIntelDataset.json.name === "TrailGenic Gear Intelligence Dataset — Q2 2026",
  "/datasets/gear/intel should return the Q2 2026 dataset name"
);
assert(
  gearIntelDataset.json.hasPart?.length === 42,
  `/datasets/gear/intel should return 42 products, got ${gearIntelDataset.json.hasPart?.length ?? 0}`
);

const conditioningChecks = [
  { name: "tg.conditioning.walking.get", datasetId: "tg_walking_conditioning_v1", route: "/datasets/conditioning/walking" },
  { name: "tg.conditioning.rucking.get", datasetId: "tg_rucking_conditioning_v1", route: "/datasets/conditioning/rucking" },
  { name: "tg.conditioning.running.get", datasetId: "tg_running_conditioning_v1", route: "/datasets/conditioning/running" }
];
for (const check of conditioningChecks) {
  const call = await postMcp("tools/call", { name: check.name, arguments: {} });
  const content = call.json.result.structuredContent;
  assert(content.dataset_id === check.datasetId, `${check.name} should return ${check.datasetId}`);
  assert(content.privacy_scope?.data_granularity === "aggregate_only", `${check.name} should be aggregate-only`);
  assert(Array.isArray(content.records) && content.records.length > 0, `${check.name} should return aggregate findings`);

  const route = await getJson(check.route);
  assert(route.response.ok && route.json.dataset_id === check.datasetId, `${check.route} should return ${check.datasetId}`);
}

const bioAgeCall = await postMcp("tools/call", {
  name: "tg.longevity.bioAge.compute",
  arguments: { age: 53, resting_hr: 59, distance_mi: 10.94, elevation_gain_ft: 4140, moving_time_min: 256, avg_hr: 122, overnight_hrv: 31 }
});
assert(
  bioAgeCall.json.result.structuredContent.result.biological_age_years.midpoint === 35,
  "bioAge compute should return biological_age_years.midpoint === 35 for the validated session"
);

const nutritionDataset = await getJson("/datasets/nutrition");
assert(nutritionDataset.response.ok, "/datasets/nutrition should return JSON");
const fullNutritionRecords = nutritionDataset.json.records ?? [];
const realCategory = fullNutritionRecords.find((record) => record.food_category)?.food_category;
assert(realCategory, "nutrition dataset should contain a real food_category");

const nutritionCall = await postMcp("tools/call", {
  name: "tg.nutrition.get",
  arguments: { food_category: realCategory }
});
const nutritionRecords = nutritionCall.json.result.structuredContent.records;
assert(nutritionRecords.length > 0, "filtered nutrition call should return records");
assert(nutritionRecords.length < fullNutritionRecords.length, "filtered nutrition call should return fewer than full dataset");
assert(nutritionRecords.length <= 200, "filtered nutrition call should be bounded to <= 200 records");
assert(nutritionRecords.every((record) => record.food_category === realCategory), "nutrition records should match requested category");

const unknownTool = await postMcp("tools/call", { name: "tg.unknown.tool", arguments: {} });
assert(unknownTool.json.error?.code === -32602, "unknown tool should map to JSON-RPC -32602");

const unknownMethod = await postMcp("tg/unknownMethod");
assert(unknownMethod.json.error?.code === -32601, "unknown method should map to JSON-RPC -32601");

const getMcp = await fetch(`${BASE}/mcp`);
assert(getMcp.status === 405, "GET /mcp should return 405");
assert(getMcp.headers.get("allow") === "POST", "GET /mcp should include Allow: POST");

const capabilities = await getJson("/capabilities.json");
const capabilityIds = toolIdsFromInventory(capabilities.json.tools);
assert(JSON.stringify(capabilityIds) === JSON.stringify(listIds), "capabilities tool ids should equal tools/list ids");
assert(Array.isArray(capabilities.json.content_links) && capabilities.json.content_links.length === 12, "capabilities should expose demoted content_links");

const registry = await getJson("/.well-known/tool-registry.json");
const registryIds = toolIdsFromInventory(registry.json.tools);
assert(JSON.stringify(registryIds) === JSON.stringify(listIds), "tool registry ids should equal tools/list ids");
assert(Array.isArray(registry.json.content_links) && registry.json.content_links.length === 12, "tool registry should expose demoted content_links");

const health = await getJson("/health");
assert(health.json.uptime === null, "/health uptime should be null");

const datasetIndex = await getJson("/datasets/index");
assert(datasetIndex.json.datasets?.some((dataset) => dataset.dataset_id === "tg_nutrition_dataset_v1"), "/datasets/index should return enabled datasets");
for (const datasetId of ["tg_walking_conditioning_v1", "tg_rucking_conditioning_v1", "tg_running_conditioning_v1"]) {
  assert(datasetIndex.json.datasets?.some((dataset) => dataset.dataset_id === datasetId), `/datasets/index should include ${datasetId}`);
}

const physiologyModule = await getJson("/datasets/physiology-adaptation/seven-day-aftereffect");
assert(physiologyModule.response.ok && physiologyModule.json.dataset_id, "physiology module endpoint should return JSON");

const corsPreflight = await fetch(`${BASE}/mcp`, {
  method: "OPTIONS",
  headers: { "access-control-request-method": "POST" }
});
assert(corsPreflight.status === 204, "OPTIONS /mcp should return 204");
assert(corsPreflight.headers.get("access-control-allow-origin") === "*", "OPTIONS should include CORS");

console.log("TrailGenic live acceptance passed.");
