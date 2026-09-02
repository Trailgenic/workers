import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { TRAILGENIC_WEBMCP_PROTOCOLS } from "../lib/webmcp-protocols.js";

const loadJson = async (relativePath) => JSON.parse(await readFile(new URL(relativePath, import.meta.url), "utf8"));
const fixtures = new Map([
  ["/datasets/protocols", await loadJson("../datasets/protocols/tg_protocol_kernel_v1.json")],
  ["/datasets/conditioning/walking", await loadJson("../datasets/conditioning/tg_walking_conditioning_v1.json")],
  ["/datasets/conditioning/rucking", await loadJson("../datasets/conditioning/tg_rucking_conditioning_v1.json")],
  ["/datasets/conditioning/running", await loadJson("../datasets/conditioning/tg_running_conditioning_v1.json")],
  ["/datasets/hiking", await loadJson("../datasets/hiking/tg_hikeworldmodel_v3_1.json")]
]);

const tools = new Map();
let focusedPath = null;
globalThis.window = { location: { href: "https://www.trailgenic.com/protocols" } };
globalThis.document = {
  modelContext: {
    async registerTool(tool) {
      tools.set(tool.name, tool);
    }
  },
  querySelectorAll() {
    return [{
      href: "https://www.trailgenic.com/protocols/trailgenic-adaptation-protocol-v1",
      scrollIntoView() { focusedPath = "/protocols/trailgenic-adaptation-protocol-v1"; },
      focus() {}
    }];
  }
};
globalThis.fetch = async (input) => {
  const path = new URL(String(input)).pathname;
  const fixture = fixtures.get(path);
  return fixture
    ? new Response(JSON.stringify(fixture), { status: 200, headers: { "content-type": "application/json" } })
    : new Response("Not Found", { status: 404 });
};

new Function(TRAILGENIC_WEBMCP_PROTOCOLS)();
for (let attempt = 0; attempt < 20 && tools.size < 2; attempt += 1) {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

assert.deepEqual([...tools.keys()].sort(), ["compare_trailgenic_modalities", "get_trailgenic_protocol"]);
assert.equal(window.__trailgenicWebMCP.surface, "protocols");

const protocolResult = await tools.get("get_trailgenic_protocol").execute({ protocol_level: 3 });
assert.equal(protocolResult.structuredContent.protocol.protocol_sequence, 3);
assert.match(protocolResult.structuredContent.evidence_boundary, /does not establish causal mechanisms/i);
assert.equal(focusedPath, "/protocols/trailgenic-adaptation-protocol-v1");

const comparisonResult = await tools.get("compare_trailgenic_modalities").execute({ modalities: ["walking", "hiking"] });
assert.deepEqual(comparisonResult.structuredContent.compared_modalities, ["walking", "hiking"]);
assert.equal(comparisonResult.structuredContent.results[0].session_count, 22);
assert.equal(comparisonResult.structuredContent.results[1].session_count, 36);
assert.match(comparisonResult.structuredContent.comparison_boundary, /different session designs/i);
assert.match(comparisonResult.structuredContent.privacy_boundary, /no raw telemetry/i);

await assert.rejects(
  () => tools.get("compare_trailgenic_modalities").execute({ modalities: ["walking", "walking"] }),
  /unique values/
);
await assert.rejects(
  () => tools.get("get_trailgenic_protocol").execute({ protocol_level: 3, diagnose: true }),
  /accepts exactly/
);

console.log("TrailGenic Protocols WebMCP verification passed.");
