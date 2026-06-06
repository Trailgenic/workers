import { DATASETS } from "../lib/datasets.js";
import {
  BUILD,
  CONTENT_LINKS,
  DATA_TOOLS,
  ENTITY,
  MCP_ORIGIN,
  capabilitiesDocument,
  datasetCatalog,
  mcpTools,
  toolRegistryDocument
} from "../lib/registry.js";
import { DATASET_JSON_BY_SOURCE_PATH, TOOL_HANDLERS, datasetSourcePaths } from "../lib/queries.js";
import { emptyResponse, jsonResponse, optionsResponse, textResponse, withCors } from "../lib/http.js";

const jsonRpcResult = (id, result) => jsonResponse({ jsonrpc: "2.0", id, result }, { cacheControl: "no-cache" });

const jsonRpcError = (id, code, message) =>
  jsonResponse({ jsonrpc: "2.0", id, error: { code, message } }, { cacheControl: "no-cache" });

const normalizePath = (pathname) => (pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname);

const datasetRoutes = datasetSourcePaths();

const serveDataset = async (sourcePath) => {
  const bundledDataset = DATASET_JSON_BY_SOURCE_PATH.get(sourcePath);

  if (bundledDataset) {
    return jsonResponse(bundledDataset);
  }

  const datasetURL = `https://raw.githubusercontent.com/Trailgenic/workers/main/${sourcePath}`;
  const dataset = await fetch(datasetURL, { cf: { cacheTtl: 3600, cacheEverything: true } });

  if (!dataset.ok) {
    return textResponse(`Dataset fetch failed: ${dataset.status}`, { status: 500 });
  }

  return new Response(await dataset.text(), {
    status: 200,
    headers: withCors({
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600"
    })
  });
};

const handleMcp = async (request) => {
  if (request.method === "GET") {
    return textResponse("Method Not Allowed", { status: 405, headers: { Allow: "POST" } });
  }

  if (request.method !== "POST") {
    return textResponse("Method Not Allowed", { status: 405, headers: { Allow: "POST" } });
  }

  let rpc;
  try {
    rpc = await request.json();
  } catch {
    return jsonRpcError(null, -32700, "Parse error: invalid JSON");
  }

  const { id = null, method, params = {} } = rpc ?? {};

  if (method === "notifications/initialized") {
    return emptyResponse({ status: 202 });
  }

  if (method === "initialize") {
    return jsonRpcResult(id, {
      protocolVersion: params.protocolVersion ?? "2025-06-18",
      capabilities: { tools: {} },
      serverInfo: { name: "TrailGenic", version: BUILD.version }
    });
  }

  if (method === "ping") {
    return jsonRpcResult(id, {});
  }

  if (method === "tools/list") {
    return jsonRpcResult(id, { tools: mcpTools() });
  }

  if (method === "tools/call") {
    const toolName = params.name;
    const handler = TOOL_HANDLERS.get(toolName);

    if (!handler) {
      return jsonRpcError(id, -32602, `Unknown tool: ${toolName ?? "<missing>"}`);
    }

    try {
      const result = await handler(params.arguments ?? {});
      return jsonRpcResult(id, {
        content: [{ type: "text", text: JSON.stringify(result) }],
        structuredContent: result
      });
    } catch (error) {
      return jsonRpcError(id, -32603, error?.message ?? "Tool execution failed");
    }
  }

  return jsonRpcError(id, -32601, `Method not found: ${method ?? "<missing>"}`);
};

const rootDiscovery = () => ({
  name: "TrailGenic MCP Endpoint",
  entity: {
    name: ENTITY.name,
    domain: ENTITY.domain,
    founder: ENTITY.founder
  },
  registry: `${MCP_ORIGIN}/.well-known/tool-registry.json`,
  plugin: `${MCP_ORIGIN}/.well-known/ai-plugin.json`,
  openapi: `${MCP_ORIGIN}/.well-known/openapi.json`,
  capabilities: `${MCP_ORIGIN}/capabilities.json`,
  datasets: `${MCP_ORIGIN}/datasets/index`,
  mcp: `${MCP_ORIGIN}/mcp`,
  health: `${MCP_ORIGIN}/health`,
  status: "active",
  discovery_protocol: "MCP JSON-RPC 2.0",
  last_updated: BUILD.released
});

const pointerRegistry = () => ({
  registry_version: "1.0",
  entity: {
    name: ENTITY.name,
    domain: ENTITY.domain,
    founder: ENTITY.founder
  },
  discovery: {
    protocol: "MCP JSON-RPC 2.0",
    endpoint: `${MCP_ORIGIN}/.well-known/tool-registry.json`,
    transport: `${MCP_ORIGIN}/mcp`
  }
});

const health = () => ({
  entity: "TrailGenic",
  status: "healthy",
  mcp_status: "operational",
  registry_status: "operational",
  plugin_status: "operational",
  openapi_status: "operational",
  capabilities_status: "operational",
  uptime: null,
  uptime_note: "Uptime is observed via Cloudflare observability, not asserted in this endpoint.",
  region: "global",
  infrastructure: {
    platform: "Cloudflare Workers",
    protocol: "MCP JSON-RPC 2.0 over Streamable HTTP-compatible POST",
    agent_ready: true
  },
  last_checked: new Date().toISOString()
});

const pluginManifest = () => ({
  schema_version: "v1",
  name_for_human: "TrailGenic",
  name_for_model: "trailgenic",
  description_for_human:
    "TrailGenic longevity intelligence system providing protocols, trail intelligence, physiology models, fueling systems, and recovery strategies.",
  description_for_model:
    "TrailGenic provides structured longevity protocols, trail intelligence, physiology adaptation models, fueling systems, recovery protocols, and performance playbooks. Use POST /mcp for real MCP JSON-RPC tool calls and dataset endpoints for public read-only data.",
  auth: { type: "none" },
  api: {
    type: "openapi",
    url: `${MCP_ORIGIN}/.well-known/openapi.json`,
    is_user_authenticated: false
  },
  logo_url: "https://trailgenic.com/favicon.ico",
  contact_email: "support@trailgenic.com",
  legal_info_url: "https://trailgenic.com"
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
        responses: { "200": { description: "JSON-RPC response" }, "202": { description: "Initialized notification accepted" } }
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
      "TrailGenic public read-only MCP JSON-RPC transport and preserved structured dataset endpoints. Authentication is none."
  },
  servers: [{ url: MCP_ORIGIN }],
  paths: openApiPaths()
});

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const normalizedPath = normalizePath(url.pathname);

    if (request.method === "OPTIONS") {
      return optionsResponse();
    }

    if (
      ["trailgenic.com", "www.trailgenic.com"].includes(url.hostname) &&
      normalizedPath === "/.well-known/tool-registry.json"
    ) {
      return jsonResponse(pointerRegistry());
    }

    if (normalizedPath === "/mcp") {
      return handleMcp(request);
    }

    if (normalizedPath === "/" || normalizedPath === "") {
      return jsonResponse(rootDiscovery());
    }

    if (normalizedPath === "/capabilities.json") {
      return jsonResponse(capabilitiesDocument());
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
      return jsonResponse(toolRegistryDocument());
    }

    if (normalizedPath === "/.well-known/ai-plugin.json") {
      return jsonResponse(pluginManifest());
    }

    if (normalizedPath === "/.well-known/openapi.json") {
      return jsonResponse(openApi());
    }

    if (CONTENT_LINKS.some((link) => link.url === `https://www.trailgenic.com${normalizedPath}`)) {
      return textResponse("Content link endpoints are hosted on www.trailgenic.com, not this MCP worker.", { status: 404 });
    }

    return textResponse("Not Found", { status: 404 });
  }
};
