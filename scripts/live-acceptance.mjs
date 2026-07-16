import { BUILD } from "../lib/registry.js";
const BASE = process.env.BASE || "https://mcp.trailgenic.com";

let nextId = 1;
let nextMcpPostAt = 0;

const MCP_POST_INTERVAL_MS = 1100;
const MCP_RETRY_DELAY_MS = 11000;

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const assert = (condition, message) => {
  if (!condition) {
    throw new Error(message);
  }
};

const paceMcpPost = async () => {
  const now = Date.now();
  const waitMs = Math.max(0, nextMcpPostAt - now);
  nextMcpPostAt = Math.max(now, nextMcpPostAt) + MCP_POST_INTERVAL_MS;
  if (waitMs > 0) {
    await delay(waitMs);
  }
};

const mcpPostFetch = async (options) => {
  await paceMcpPost();
  return fetch(`${BASE}/mcp`, { method: "POST", ...options });
};

const bodyPreview = (text) => text.slice(0, 200);

const shouldRetryMcpPost = (response, contentType) =>
  response.status === 429 || contentType.toLowerCase().includes("text/html");

const parseMcpJsonResponse = (response, text, contentType, method) => {
  const preview = bodyPreview(text);
  if (!response.ok) {
    throw new Error(`MCP ${method} failed with HTTP ${response.status}: ${preview}`);
  }
  if (!contentType.toLowerCase().includes("application/json")) {
    throw new Error(`MCP ${method} returned non-JSON HTTP ${response.status}: ${preview}`);
  }
  try {
    return text ? JSON.parse(text) : null;
  } catch (error) {
    throw new Error(`MCP ${method} returned invalid JSON HTTP ${response.status}: ${preview}`, { cause: error });
  }
};

const postMcp = async (method, params = {}, extra = {}) => {
  const body = { jsonrpc: "2.0", id: nextId++, method, params, ...extra };
  const request = {
    headers: { "content-type": "application/json", "mcp-protocol-version": "2025-06-18" },
    body: JSON.stringify(body)
  };

  for (let attempt = 0; attempt < 2; attempt++) {
    const response = await mcpPostFetch(request);
    const text = await response.text();
    const contentType = response.headers.get("content-type") ?? "";
    if (attempt === 0 && shouldRetryMcpPost(response, contentType)) {
      await delay(MCP_RETRY_DELAY_MS);
      continue;
    }
    const json = parseMcpJsonResponse(response, text, contentType, method);
    return { response, json };
  }

  throw new Error(`MCP ${method} failed after retry`);
};

const getJson = async (path) => {
  const response = await fetch(`${BASE}${path}`);
  const json = await response.json();
  return { response, json };
};

const toolIdsFromList = (tools) => tools.map((tool) => tool.name ?? tool.id).sort();
const toolIdsFromInventory = (tools) => tools.map((tool) => tool.name ?? tool.id).sort();

console.log(`Running TrailGenic live acceptance against ${BASE}`);

const initParams = (protocolVersion) => ({
  protocolVersion,
  capabilities: {},
  clientInfo: { name: "tg-live-acceptance", version: "1.0" }
});

const init = await postMcp("initialize", initParams("2025-06-18"));
assert(init.response.ok, "initialize should return HTTP 2xx");
assert(init.json.result, `initialize should return a result, got: ${JSON.stringify(init.json).slice(0, 200)}`);
assert(init.json.result.serverInfo.name === "TrailGenic", "initialize serverInfo.name should be TrailGenic");
assert(init.json.result.serverInfo.version === BUILD.version, `server version should be ${BUILD.version}, got ${init.json.result.serverInfo.version}`);
assert(init.json.result.protocolVersion === "2025-06-18", "initialize should negotiate 2025-06-18");

const initPrimary = await postMcp("initialize", initParams("2025-11-25"));
assert(initPrimary.json.result?.protocolVersion === "2025-11-25", "initialize should negotiate primary protocol 2025-11-25");
assert(init.response.headers.get("access-control-allow-origin") === "*", "initialize response should include CORS");

const initialized = await mcpPostFetch({
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" })
});
assert(initialized.status === 202, "notifications/initialized should return HTTP 202");
assert(initialized.headers.get("access-control-allow-origin") === "*", "initialized response should include CORS");

const ping = await postMcp("ping");
assert(ping.response.ok && ping.json.result && Object.keys(ping.json.result).length === 0, "ping should return empty result");

const listed = await postMcp("tools/list");
const listIds = toolIdsFromList(listed.json.result.tools);
const rootDiscovery = await getJson(`/?cache_bust=${Date.now()}`);
assert(rootDiscovery.response.headers.get("cache-control") === "no-cache", "root discovery should be served with Cache-Control: no-cache");
assert(rootDiscovery.response.ok, "root browser discovery should return HTTP 200 JSON");
assert(rootDiscovery.json.build_version === BUILD.version, `root discovery build_version should be ${BUILD.version}, got ${rootDiscovery.json.build_version}`);
const rootToolIds = [...rootDiscovery.json.tools].sort();
assert(JSON.stringify(listIds) === JSON.stringify(rootToolIds), "tools/list ids should match root discovery tools");
assert(listIds.includes("tg.hiking.worldModel.get"), "tools/list should include tg.hiking.worldModel.get");
assert(listIds.includes("tg.longevity.bioAge.compute"), "tools/list should include tg.longevity.bioAge.compute");
assert(listIds.includes("tg.gear.getIntel"), "tools/list should include tg.gear.getIntel");
for (const toolId of ["tg.conditioning.walking.get", "tg.conditioning.rucking.get", "tg.conditioning.running.get"]) {
  assert(listIds.includes(toolId), `tools/list should include ${toolId}`);
}


const hikingCall = await postMcp("tools/call", { name: "tg.hiking.worldModel.get", arguments: {} });
const hikingModel = hikingCall.json.result.structuredContent;
assert(hikingModel.dataset_id === "tg_hikeworldmodel_v2", "hiking world model tool should return tg_hikeworldmodel_v2");
assert(hikingModel.privacy_scope?.data_granularity === "aggregate_only", "hiking world model should be aggregate-only");
assert(hikingModel.summary_statistics?.hiking_sessions === 31, "hiking world model should report 31 hiking sessions");
assert(hikingModel.summary_statistics?.total_distance_miles === 339.40, "hiking world model should report 339.40 miles");
assert(hikingModel.summary_statistics?.total_elevation_gain_ft === 130166, "hiking world model should report 130166 ft gain");
for (const effort of ["Mount Elbert", "Manitou Incline", "Pikes Peak", "Wheeler Peak"]) {
  assert(hikingModel.western_altitude_block?.efforts?.includes(effort), `Western Block should include ${effort}`);
}
const hikingRoute = await getJson("/datasets/hiking");
assert(hikingRoute.response.ok && hikingRoute.json.dataset_id === "tg_hikeworldmodel_v2", "/datasets/hiking should return tg_hikeworldmodel_v2");
const hikingAlias = await getJson("/datasets/hiking/world-model");
assert(hikingAlias.response.ok && hikingAlias.json.dataset_id === "tg_hikeworldmodel_v2", "/datasets/hiking/world-model should return tg_hikeworldmodel_v2");
const hrDriftRoute = await getJson("/datasets/physiology-adaptation/hr-drift-adaptation-vs-fitness");
assert(hrDriftRoute.json.methodology?.route_aware === true, "HR drift endpoint should include route-aware methodology");
const sleepRoute = await getJson("/datasets/physiology-adaptation/sleep-science-endurance");
for (const key of ["mount_elbert", "pikes_peak", "wheeler_peak"]) {
  assert(sleepRoute.json.recovery_archetypes?.[key], `sleep science should include ${key} recovery archetype`);
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
const unknownToolResult = unknownTool.json.result;
assert(unknownToolResult?.isError === true, "unknown tool should return an isError tool result");
assert(JSON.stringify(unknownToolResult.content ?? "").includes("not found"), "unknown tool result should explain the tool was not found");

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
for (const datasetId of ["tg_walking_conditioning_v1", "tg_rucking_conditioning_v1", "tg_running_conditioning_v1", "tg_hikeworldmodel_v2"]) {
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

const acceptJsonOnly = await mcpPostFetch({
  headers: { "content-type": "application/json", accept: "application/json" },
  body: JSON.stringify({ jsonrpc: "2.0", id: nextId++, method: "ping" })
});
assert(acceptJsonOnly.ok, "JSON-only Accept should be normalized and succeed");

const acceptEventStreamOnly = await mcpPostFetch({
  headers: { "content-type": "application/json", accept: "text/event-stream" },
  body: JSON.stringify({ jsonrpc: "2.0", id: nextId++, method: "ping" })
});
assert(acceptEventStreamOnly.status === 406, "event-stream-only Accept should return 406");

const badContentType = await mcpPostFetch({
  headers: { "content-type": "text/plain", accept: "application/json" },
  body: JSON.stringify({ jsonrpc: "2.0", id: nextId++, method: "ping" })
});
assert(badContentType.status === 415, "non-JSON Content-Type should return 415");

assert(Array.isArray(rootDiscovery.json.tools), "root discovery should list tools");
assert(JSON.stringify(rootToolIds) === JSON.stringify(listIds), "root discovery tool ids should match tools/list ids");
assert(Array.isArray(rootDiscovery.json.resources) && rootDiscovery.json.resources.length > 0, "root discovery should list generated resources");
assert(Array.isArray(rootDiscovery.json.supported_protocol_versions) && rootDiscovery.json.supported_protocol_versions.includes("2025-11-25"), "root discovery should advertise 2025-11-25");

const resourcesListed = await postMcp("resources/list");
const resourceUris = (resourcesListed.json.result?.resources ?? []).map((resource) => resource.uri).sort();
assert(resourceUris.length === rootDiscovery.json.resources.length, "resources/list should equal root discovery resource inventory");
assert(JSON.stringify(resourceUris) === JSON.stringify([...rootDiscovery.json.resources].sort()), "resources/list URIs should match root discovery URIs");

const indexResource = await postMcp("resources/read", { uri: "trailgenic://datasets/index" });
const indexContents = indexResource.json.result?.contents?.[0]?.text;
assert(indexContents, "resources/read for dataset index should return contents");
const indexParsed = JSON.parse(indexContents);
const restIndex = await getJson("/datasets/index");
assert(JSON.stringify(indexParsed) === JSON.stringify(restIndex.json), "dataset-index resource should deep-equal REST dataset index");

const disallowedOriginPost = await mcpPostFetch({
  headers: { "content-type": "application/json", origin: "https://evil.example" },
  body: JSON.stringify({ jsonrpc: "2.0", id: nextId++, method: "ping" })
});
assert(disallowedOriginPost.status === 403, "disallowed-Origin POST should return 403");

console.log("TrailGenic live acceptance passed.");
