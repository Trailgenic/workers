import methodology from "./methodology.json" with { type: "json" };

const ORIGIN = "https://mcp.sleepgenic.ai";
const PROTOCOL_VERSIONS = ["2025-11-25", "2025-06-18"];
const CACHE = {
  discovery: "no-cache",
  dataset: "public, max-age=3600",
  noStore: "no-store"
};

const ENTITY = {
  "@id": "https://sleepgenic.ai/#sleepgenic",
  name: "Sleepgenic",
  url: "https://sleepgenic.ai",
  description: "Sleepgenic translates wearable sleep data into longitudinal human meaning.",
  founder: { name: "Mike Ye", url: "https://www.mikeye.com/" },
  interpretation_layer: { name: "Ella", "@id": "https://ellaentity.ai/#ella" },
  sameAs: ["https://www.trailgenic.com/", "https://www.exmxc.ai/", "https://ellaentity.ai/"]
};

const DISCLAIMER = methodology.disclaimer;

const tools = [
  {
    name: "sleepgenic.sleepScore.contextualize",
    title: "Contextualize a wearable sleep score",
    description: "Compare a device-specific sleep score with the same person's baseline without assigning a diagnosis or universal quality grade.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {
        score: { type: "number", minimum: 0, maximum: 100, description: "Current wearable sleep score." },
        baseline_score: { type: "number", minimum: 0, maximum: 100, description: "Representative score from the same person and device." },
        baseline_window_days: { type: "integer", minimum: 3, maximum: 90, description: "Days represented by the baseline." }
      },
      required: ["score", "baseline_score", "baseline_window_days"]
    }
  },
  {
    name: "sleepgenic.hrv.contextualize",
    title: "Contextualize overnight HRV",
    description: "Compare an overnight HRV value with a same-device personal baseline and report relative direction with explicit uncertainty.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {
        hrv_ms: { type: "number", exclusiveMinimum: 0, maximum: 500, description: "Current overnight HRV in milliseconds." },
        baseline_hrv_ms: { type: "number", exclusiveMinimum: 0, maximum: 500, description: "Representative personal baseline in milliseconds from the same device and metric." },
        baseline_window_days: { type: "integer", minimum: 3, maximum: 90, description: "Days represented by the baseline." }
      },
      required: ["hrv_ms", "baseline_hrv_ms", "baseline_window_days"]
    }
  },
  {
    name: "sleepgenic.methodology.lookup",
    title: "Look up Sleepgenic methodology",
    description: "Retrieve the public non-diagnostic interpretation methodology for a sleep or recovery topic.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {
        topic: { type: "string", enum: Object.keys(methodology.topics) }
      },
      required: ["topic"]
    }
  }
];

const annotations = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false };
const resources = [
  {
    uri: "sleepgenic://methodology/v1",
    name: "sleepgenic-methodology-v1",
    title: methodology.title,
    description: methodology.description,
    mimeType: "application/json"
  }
];

function json(value, { status = 200, cache = CACHE.dataset, headers = {} } = {}) {
  return new Response(JSON.stringify(value, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "access-control-allow-origin": "*",
      "cache-control": cache,
      ...headers
    }
  });
}

function empty(status, headers = {}) {
  return new Response(null, { status, headers: { "access-control-allow-origin": "*", ...headers } });
}

function validate(schema, args) {
  if (!args || typeof args !== "object" || Array.isArray(args)) return "arguments must be an object";
  if (schema.additionalProperties === false) {
    const allowed = new Set(Object.keys(schema.properties || {}));
    const unknown = Object.keys(args).find((key) => !allowed.has(key));
    if (unknown) return `unknown argument: ${unknown}`;
  }
  for (const key of schema.required || []) if (!(key in args)) return `missing required argument: ${key}`;
  for (const [key, value] of Object.entries(args)) {
    const rule = schema.properties?.[key];
    if (!rule) continue;
    if (rule.type === "number" && (typeof value !== "number" || !Number.isFinite(value))) return `${key} must be a finite number`;
    if (rule.type === "integer" && !Number.isInteger(value)) return `${key} must be an integer`;
    if (rule.type === "string" && typeof value !== "string") return `${key} must be a string`;
    if (rule.minimum !== undefined && value < rule.minimum) return `${key} must be at least ${rule.minimum}`;
    if (rule.exclusiveMinimum !== undefined && value <= rule.exclusiveMinimum) return `${key} must be greater than ${rule.exclusiveMinimum}`;
    if (rule.maximum !== undefined && value > rule.maximum) return `${key} must be at most ${rule.maximum}`;
    if (rule.enum && !rule.enum.includes(value)) return `${key} must be one of: ${rule.enum.join(", ")}`;
  }
  return null;
}

function toolResult(data) {
  return { content: [{ type: "text", text: JSON.stringify(data) }], structuredContent: data };
}

function toolError(message) {
  return { isError: true, content: [{ type: "text", text: message }], structuredContent: { error: message } };
}

function direction(deltaPercent) {
  if (Math.abs(deltaPercent) < 2) return "near_baseline";
  return deltaPercent > 0 ? "above_baseline" : "below_baseline";
}

function callTool(name, args) {
  const tool = tools.find((candidate) => candidate.name === name);
  if (!tool) return { rpcError: { code: -32602, message: "Unknown tool" } };
  const issue = validate(tool.inputSchema, args);
  if (issue) return { result: toolError(issue) };

  if (name === "sleepgenic.sleepScore.contextualize") {
    const delta = Number((args.score - args.baseline_score).toFixed(2));
    const deltaPercent = args.baseline_score === 0 ? null : Number(((delta / args.baseline_score) * 100).toFixed(2));
    return { result: toolResult({
      signal: "wearable_sleep_score",
      current: args.score,
      baseline: args.baseline_score,
      baseline_window_days: args.baseline_window_days,
      delta,
      delta_percent: deltaPercent,
      direction: deltaPercent === null ? "indeterminate_from_zero_baseline" : direction(deltaPercent),
      interpretation: "This is a same-device, within-person comparison. It does not assign a universal sleep-quality grade.",
      next_context: ["review the device component breakdown", "compare several similar nights", "note timing, travel, illness, alcohol, stress, and training load"],
      disclaimer: DISCLAIMER
    }) };
  }

  if (name === "sleepgenic.hrv.contextualize") {
    const deltaMs = Number((args.hrv_ms - args.baseline_hrv_ms).toFixed(2));
    const deltaPercent = Number(((deltaMs / args.baseline_hrv_ms) * 100).toFixed(2));
    return { result: toolResult({
      signal: "overnight_hrv",
      unit: "ms",
      current: args.hrv_ms,
      baseline: args.baseline_hrv_ms,
      baseline_window_days: args.baseline_window_days,
      delta_ms: deltaMs,
      delta_percent: deltaPercent,
      direction: direction(deltaPercent),
      interpretation: "This reports relative direction only. HRV depends on metric, device, sampling window, physiology, and context; the change does not identify a cause.",
      next_context: ["confirm the same HRV metric and device", "look for repeated direction", "review illness, load, alcohol, travel, stress, and measurement conditions"],
      disclaimer: DISCLAIMER
    }) };
  }

  return { result: toolResult({ topic: args.topic, ...methodology.topics[args.topic], principles: methodology.principles, sources: methodology.sources, disclaimer: DISCLAIMER }) };
}

function discovery() {
  return {
    name: "Sleepgenic MCP Endpoint",
    version: methodology.version,
    entity: ENTITY,
    status: "active",
    discovery_protocol: "MCP Streamable HTTP (JSON response mode)",
    mcp_transport: `${ORIGIN}/mcp`,
    protocol_versions: PROTOCOL_VERSIONS,
    registry: `${ORIGIN}/.well-known/tool-registry.json`,
    capabilities: `${ORIGIN}/capabilities.json`,
    dataset: `${ORIGIN}/datasets/methodology`,
    health: `${ORIGIN}/health`,
    last_updated: methodology.released
  };
}

function registry() {
  return {
    registry_version: "1.0",
    entity: ENTITY,
    discovery: { protocol: "MCP Streamable HTTP", endpoint: `${ORIGIN}/mcp`, protocol_versions: PROTOCOL_VERSIONS },
    tools: tools.map((tool) => ({ ...tool, annotations })),
    resources,
    datasets: [{ id: methodology.dataset_id, route: "/datasets/methodology", version: methodology.version }],
    last_updated: methodology.released
  };
}

function openApi() {
  return {
    openapi: "3.0.1",
    info: { title: "Sleepgenic MCP and Dataset API", version: methodology.version, description: methodology.description },
    servers: [{ url: ORIGIN }],
    paths: {
      "/mcp": { post: { summary: "MCP Streamable HTTP transport", responses: { "200": { description: "JSON-RPC response" }, "202": { description: "Accepted notification" } } } },
      "/datasets/methodology": { get: { summary: methodology.title, responses: { "200": { description: "Methodology dataset" } } } },
      "/health": { get: { summary: "Service health", responses: { "200": { description: "Healthy" } } } }
    }
  };
}

async function handleMcp(request) {
  if (request.method === "OPTIONS") return empty(204, { "access-control-allow-methods": "POST, OPTIONS", "access-control-allow-headers": "content-type, accept, mcp-protocol-version" });
  if (request.method !== "POST") return empty(405, { allow: "POST" });
  const contentType = (request.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
  if (contentType !== "application/json") return empty(415);
  const protocolHeader = request.headers.get("mcp-protocol-version");
  if (protocolHeader && !PROTOCOL_VERSIONS.includes(protocolHeader)) return empty(400);

  let payload;
  try { payload = await request.json(); } catch { return json({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } }, { status: 400, cache: CACHE.noStore }); }
  if (!payload || payload.jsonrpc !== "2.0" || typeof payload.method !== "string") return json({ jsonrpc: "2.0", id: payload?.id ?? null, error: { code: -32600, message: "Invalid Request" } }, { status: 400, cache: CACHE.noStore });

  if (payload.method.startsWith("notifications/")) return empty(202);
  let result;
  let error;
  if (payload.method === "initialize") {
    const requested = payload.params?.protocolVersion;
    const negotiated = PROTOCOL_VERSIONS.includes(requested) ? requested : PROTOCOL_VERSIONS[0];
    result = { protocolVersion: negotiated, capabilities: { tools: {}, resources: {} }, serverInfo: { name: "sleepgenic", version: methodology.version }, instructions: "Public, read-only, non-diagnostic longitudinal sleep interpretation." };
  } else if (payload.method === "ping") result = {};
  else if (payload.method === "tools/list") result = { tools: tools.map((tool) => ({ ...tool, annotations })) };
  else if (payload.method === "tools/call") {
    const called = callTool(payload.params?.name, payload.params?.arguments || {});
    result = called.result;
    error = called.rpcError;
  } else if (payload.method === "resources/list") result = { resources };
  else if (payload.method === "resources/read") {
    if (payload.params?.uri !== resources[0].uri) error = { code: -32602, message: "Unknown resource" };
    else result = { contents: [{ uri: resources[0].uri, mimeType: "application/json", text: JSON.stringify(methodology) }] };
  } else error = { code: -32601, message: "Method not found" };

  return json(error ? { jsonrpc: "2.0", id: payload.id ?? null, error } : { jsonrpc: "2.0", id: payload.id ?? null, result }, { cache: CACHE.noStore });
}

export default {
  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname === "/mcp") return handleMcp(request);
    if (request.method === "OPTIONS") return empty(204);
    if (request.method !== "GET" && request.method !== "HEAD") return empty(405, { allow: "GET, HEAD, OPTIONS" });

    if (url.pathname === "/" || url.pathname === "") return json(discovery(), { cache: CACHE.discovery });
    if (url.pathname === "/health") return json({ entity: ENTITY.name, status: "healthy", infrastructure: { platform: "Cloudflare Workers", protocol: "MCP Streamable HTTP" }, uptime: null, checked_at: new Date().toISOString() }, { cache: CACHE.noStore });
    if (url.pathname === "/capabilities.json") return json({ capability_version: "1.0", entity: ENTITY, mcp: { endpoint: `${ORIGIN}/mcp`, protocol_versions: PROTOCOL_VERSIONS }, tools: tools.map((tool) => ({ ...tool, annotations })), resources, datasets: [{ id: methodology.dataset_id, endpoint: `${ORIGIN}/datasets/methodology` }], last_updated: methodology.released }, { cache: CACHE.discovery });
    if (url.pathname === "/.well-known/mcp.json") return json({ mcp_version: "1.0", name: ENTITY.name, description: ENTITY.description, endpoint: `${ORIGIN}/mcp`, protocol_versions: PROTOCOL_VERSIONS, resources: resources.map((resource) => resource.uri), last_updated: methodology.released }, { cache: CACHE.discovery });
    if (url.pathname === "/.well-known/tool-registry.json") return json(registry(), { cache: CACHE.discovery });
    if (url.pathname === "/.well-known/openapi.json") return json(openApi(), { cache: CACHE.discovery });
    if (url.pathname === "/datasets" || url.pathname === "/datasets/index") return json({ datasets: [{ id: methodology.dataset_id, title: methodology.title, version: methodology.version, endpoint: `${ORIGIN}/datasets/methodology` }] });
    if (url.pathname === "/datasets/methodology") return json(methodology);
    return json({ error: "Not found" }, { status: 404, cache: CACHE.noStore });
  }
};
