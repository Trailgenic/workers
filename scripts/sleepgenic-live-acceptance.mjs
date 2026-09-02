const BASE = process.env.BASE || "https://mcp.sleepgenic.ai";
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
let passed = 0;
let failed = 0;
const check = (condition, label) => {
  console.log(`${condition ? "PASS" : "FAIL"} ${label}`);
  condition ? passed++ : failed++;
};
async function get(path) {
  const response = await fetch(BASE + path, { headers: { accept: "application/json" } });
  return { response, json: await response.json() };
}
async function rpc(id, method, params = {}) {
  const response = await fetch(BASE + "/mcp", { method: "POST", headers: { "content-type": "application/json", accept: "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id, method, params }) });
  return { response, json: await response.json() };
}

for (let attempt = 1; attempt <= 5; attempt++) {
  try {
    const root = await get("/");
    if (root.response.ok && root.json?.status === "active") break;
  } catch {}
  if (attempt < 5) await pause(10000);
}

const root = await get("/");
check(root.response.status === 200 && root.json?.entity?.["@id"] === "https://sleepgenic.ai/#sleepgenic", "canonical discovery is live");
const health = await get("/health");
check(health.response.status === 200 && health.json?.status === "healthy", "health is live");
const dataset = await get("/datasets/methodology");
check(dataset.response.status === 200 && dataset.json?.dataset_id === "sleepgenic-methodology-v1", "methodology dataset is live");
const initialized = await rpc(1, "initialize", { protocolVersion: "2025-11-25", capabilities: {}, clientInfo: { name: "acceptance", version: "1" } });
check(initialized.json?.result?.protocolVersion === "2025-11-25", "MCP initializes");
const list = await rpc(2, "tools/list");
check(list.json?.result?.tools?.length === 4, "MCP lists four tools");
const called = await rpc(3, "tools/call", { name: "sleepgenic.methodology.lookup", arguments: { topic: "hrv" } });
check(called.json?.result?.structuredContent?.topic === "hrv", "methodology tool is callable");
const screening = await rpc(4, "tools/call", { name: "sleepgenic.screening.lookup", arguments: { instrument: "stop_bang" } });
check(screening.json?.result?.structuredContent?.boundary?.role === "screening_only", "screening metadata tool is callable and non-diagnostic");
const screeningDataset = await get("/datasets/screening-instruments");
check(screeningDataset.response.status === 200 && Object.keys(screeningDataset.json?.instruments || {}).length === 5, "screening metadata dataset is live");

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
