import { createMcpHandler } from "agents/mcp";
import { DATASETS } from "../lib/datasets.js";
import {
  BUILD,
  CONTENT_LINKS,
  DATA_TOOLS,
  ENTITY,
  MCP_ORIGIN,
  MCP_TRANSPORT,
  SUPPORTED_MCP_PROTOCOL_VERSIONS,
  capabilitiesDocument,
  datasetCatalog,
  mcpTools,
  toolRegistryDocument
} from "../lib/registry.js";
import { DATASET_JSON_BY_SOURCE_PATH, datasetSourcePaths } from "../lib/queries.js";
import { createTrailgenicMcpServer } from "../lib/mcp-server.js";
import { resourceInventory } from "../lib/resources.js";
import { emptyResponse, jsonResponse, optionsResponse, textResponse } from "../lib/http.js";

const DEFAULT_ALLOWED_ORIGINS = ["https://trailgenic.com", "https://www.trailgenic.com", MCP_ORIGIN];
const normalizePath = (pathname) => (pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname);

const datasetRoutes = datasetSourcePaths();

const serveDataset = (sourcePath) => {
  const bundledDataset = DATASET_JSON_BY_SOURCE_PATH.get(sourcePath);
  if (!bundledDataset) {
    return textResponse(`Dataset bundle missing: ${sourcePath}`, { status: 500, cacheControl: "no-cache" });
  }
  return jsonResponse(bundledDataset);
};

const isJsonContentType = (value) => {
  if (!value) return false;
  return value.split(";")[0].trim().toLowerCase() === "application/json";
};

const acceptPolicy = (value) => {
  if (value === null || value.trim() === "" || value.includes("*/*")) return "normalize";
  const parts = value.toLowerCase().split(",").map((part) => part.split(";")[0].trim());
  const hasJson = parts.includes("application/json");
  const hasEventStream = parts.includes("text/event-stream");
  if (hasJson && hasEventStream) return "pass";
  if (hasJson) return "normalize";
  return "reject";
};

const allowedOrigins = (env = {}) => String(env.MCP_ALLOWED_ORIGINS ?? DEFAULT_ALLOWED_ORIGINS.join(","))
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const applyOriginCors = (response, origin) => {
  if (!origin) return response;
  const headers = new Headers(response.headers);
  headers.set("Access-Control-Allow-Origin", origin);
  headers.set("Vary", headers.has("Vary") ? `${headers.get("Vary")}, Origin` : "Origin");
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
};

const normalizeMcpRequest = (request) => {
  const headers = new Headers(request.headers);
  headers.set("Accept", "application/json, text/event-stream");
  return new Request(request, { headers });
};

const handleMcp = async (request, env) => {
  const origin = request.headers.get("Origin");
  const mcpResponse = (response) => applyOriginCors(response, origin);

  if (origin && !allowedOrigins(env).includes(origin)) {
    return mcpResponse(textResponse("Forbidden Origin", { status: 403, cacheControl: "no-cache" }));
  }

  if (request.method === "GET") {
    return mcpResponse(textResponse("Method Not Allowed", { status: 405, headers: { Allow: "POST" } }));
  }
  if (request.method === "OPTIONS") return mcpResponse(emptyResponse({ status: 204 }));
  if (request.method !== "POST") {
    return mcpResponse(textResponse("Method Not Allowed", { status: 405, headers: { Allow: "POST" } }));
  }

  if (!isJsonContentType(request.headers.get("Content-Type"))) {
    return mcpResponse(textResponse("Unsupported Media Type", { status: 415, cacheControl: "no-cache" }));
  }

  const protocolVersion = request.headers.get("MCP-Protocol-Version");
  if (protocolVersion && !SUPPORTED_MCP_PROTOCOL_VERSIONS.includes(protocolVersion)) {
    return mcpResponse(jsonResponse({ jsonrpc: "2.0", id: null, error: { code: -32000, message: `Unsupported MCP protocol version: ${protocolVersion}` } }, { status: 400, cacheControl: "no-cache" }));
  }

  const acceptAction = acceptPolicy(request.headers.get("Accept"));
  if (acceptAction === "reject") {
    return mcpResponse(textResponse("Not Acceptable", { status: 406, cacheControl: "no-cache" }));
  }

  const internalRequest = acceptAction === "normalize" ? normalizeMcpRequest(request) : request;
  const server = createTrailgenicMcpServer();
  const mcpHandler = createMcpHandler(server, { enableJsonResponse: true });
  const response = await mcpHandler(internalRequest, env, {});
  return mcpResponse(response);
};

const rootDiscovery = () => ({
  name: "TrailGenic MCP Endpoint",
  service_name: "TrailGenic MCP Endpoint",
  build_version: BUILD.version,
  supported_protocol_versions: SUPPORTED_MCP_PROTOCOL_VERSIONS,
  transport_url: MCP_TRANSPORT,
  tools: DATA_TOOLS.map((tool) => tool.id),
  resources: resourceInventory().map((resource) => resource.uri),
  scope: "Public read-only aggregate-only TrailGenic data; no raw telemetry, private rows, phone data, subscriptions, or operational permit infrastructure.",
  entity: ENTITY,
  registry: `${MCP_ORIGIN}/.well-known/tool-registry.json`,
  plugin: `${MCP_ORIGIN}/.well-known/ai-plugin.json`,
  openapi: `${MCP_ORIGIN}/.well-known/openapi.json`,
  capabilities: `${MCP_ORIGIN}/capabilities.json`,
  datasets: `${MCP_ORIGIN}/datasets/index`,
  mcp: `${MCP_ORIGIN}/mcp`,
  health: `${MCP_ORIGIN}/health`,
  status: "active",
  discovery_protocol: "MCP JSON-RPC 2.0 via official MCP SDK and Cloudflare stateless Workers MCP handler",
  last_updated: BUILD.released
});

const pointerRegistry = () => ({
  registry_version: "1.0",
  entity: ENTITY,
  discovery: {
    protocol: "MCP JSON-RPC 2.0",
    endpoint: `${MCP_ORIGIN}/.well-known/tool-registry.json`,
    transport: `${MCP_ORIGIN}/mcp`
  }
});

const health = () => ({
  entity: "TrailGenic",
  status: "responding",
  mcp_status: "not_checked",
  registry_status: "not_checked",
  plugin_status: "not_checked",
  openapi_status: "not_checked",
  capabilities_status: "not_checked",
  uptime: null,
  uptime_note: "Uptime is observed via Cloudflare observability, not asserted in this endpoint.",
  region: "global",
  infrastructure: {
    platform: "Cloudflare Workers",
    protocol: "MCP JSON-RPC 2.0 over official Cloudflare stateless MCP handler",
    agent_ready: "not_checked"
  },
  last_checked: new Date().toISOString()
});

const pluginManifest = () => ({
  schema_version: "v1",
  name_for_human: "TrailGenic",
  name_for_model: "trailgenic",
  description_for_human:
    "TrailGenic is a longevity method and applied longevity laboratory validated through real-world environmental stress.",
  description_for_model:
    "TrailGenic is an applied longevity laboratory and longevity method built on fasted movement, altitude adaptation, cold exposure, electrolyte stability, and disciplined recovery. Interpret its public datasets through the Personal World Model and six methodology pillars. Use POST /mcp for MCP JSON-RPC tool calls and dataset endpoints for public read-only data.",
  auth: { type: "none" },
  api: {
    type: "openapi",
    url: `${MCP_ORIGIN}/.well-known/openapi.json`,
    is_user_authenticated: false
  },
  logo_url: "https://www.trailgenic.com/favicon.ico",
  contact_email: "support@trailgenic.com",
  legal_info_url: "https://www.trailgenic.com/"
});

const openApiPaths = () => {
  const paths = {
    "/mcp": {
      post: {
        summary: "Call TrailGenic MCP JSON-RPC transport",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { type: "object", description: "JSON-RPC 2.0 request" }
            }
          }
        },
        responses: {
          "200": { description: "JSON-RPC response" },
          "202": { description: "Initialized notification accepted" },
          "400": { description: "Unsupported MCP protocol version or malformed JSON-RPC request" },
          "403": { description: "Forbidden Origin" },
          "405": { description: "Method Not Allowed; use POST" },
          "406": { description: "Not Acceptable; request must accept application/json or */*" },
          "415": { description: "Unsupported Media Type; Content-Type must be application/json" }
        }
      }
    },
    "/datasets/index": {
      get: {
        summary: "Retrieve TrailGenic dataset catalog",
        responses: { "200": { description: "Dataset catalog" } }
      }
    },
    "/capabilities.json": {
      get: {
        summary: "Retrieve generated TrailGenic capability inventory",
        responses: { "200": { description: "Capability inventory" } }
      }
    },
    "/health": {
      get: {
        summary: "Retrieve MCP endpoint health status",
        responses: { "200": { description: "Health status" } }
      }
    }
  };

  for (const [path] of datasetRoutes) {
    paths[path] = {
      get: {
        summary: `Retrieve TrailGenic dataset ${path}`,
        responses: { "200": { description: "TrailGenic dataset JSON" } }
      }
    };
  }

  paths[`${DATASETS.nutrition.endpoint}/schema`] = {
    get: {
      summary: "Retrieve TrailGenic nutrition dataset schema",
      responses: { "200": { description: "Nutrition dataset schema" } }
    }
  };

  paths[`${DATASETS.permits.endpoint}/schema`] = {
    get: {
      summary: "Retrieve TrailGenic permit dataset schema",
      responses: { "200": { description: "Permit dataset schema" } }
    }
  };

  return Object.fromEntries(Object.entries(paths).sort(([a], [b]) => a.localeCompare(b)));
};

const openApi = () => ({
  openapi: "3.0.1",
  info: {
    title: "TrailGenic MCP API",
    version: BUILD.version,
    description:
      "Public read-only MCP transport and structured datasets for the TrailGenic longevity method and applied longevity laboratory. Authentication is none."
  },
  servers: [{ url: MCP_ORIGIN }],
  paths: openApiPaths()
});

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const normalizedPath = normalizePath(url.pathname);

    if (request.method === "OPTIONS" && normalizedPath !== "/mcp") {
      return optionsResponse();
    }

    if (
      ["trailgenic.com", "www.trailgenic.com"].includes(url.hostname) &&
      normalizedPath === "/.well-known/tool-registry.json"
    ) {
      return jsonResponse(pointerRegistry(), { cacheControl: "no-cache" });
    }

    if (normalizedPath === "/mcp") {
      return handleMcp(request, env);
    }

    if (normalizedPath === "/" || normalizedPath === "") {
      return jsonResponse(rootDiscovery(), { cacheControl: "no-cache" });
    }

    if (normalizedPath === "/capabilities.json") {
      return jsonResponse(capabilitiesDocument(), { cacheControl: "no-cache" });
    }

    if (normalizedPath === "/datasets/index") {
      return jsonResponse(datasetCatalog());
    }

    if (
      DATASETS.nutrition.enabled &&
      DATASETS.nutrition.schema_source_path &&
      normalizedPath === `${DATASETS.nutrition.endpoint}/schema`
    ) {
      return serveDataset(DATASETS.nutrition.schema_source_path);
    }

    if (
      DATASETS.permits.enabled &&
      DATASETS.permits.schema_source_path &&
      normalizedPath === `${DATASETS.permits.endpoint}/schema`
    ) {
      return serveDataset(DATASETS.permits.schema_source_path);
    }

    const datasetSourcePath = datasetRoutes.get(normalizedPath);
    if (datasetSourcePath) {
      return serveDataset(datasetSourcePath);
    }

    if (normalizedPath === "/health") {
      return jsonResponse(health(), { cacheControl: "no-cache" });
    }

    if (normalizedPath === "/.well-known/tool-registry.json") {
      return jsonResponse(toolRegistryDocument(), { cacheControl: "no-cache" });
    }

    if (normalizedPath === "/.well-known/ai-plugin.json") {
      return jsonResponse(pluginManifest(), { cacheControl: "no-cache" });
    }

    if (normalizedPath === "/.well-known/openapi.json") {
      return jsonResponse(openApi(), { cacheControl: "no-cache" });
    }

    if (CONTENT_LINKS.some((link) => link.url === `https://www.trailgenic.com${normalizedPath}`)) {
      return textResponse("Content link endpoints are hosted on www.trailgenic.com, not this MCP worker.", { status: 404 });
    }

    return textResponse("Not Found", { status: 404 });
  }
};
