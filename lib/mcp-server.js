import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import Ajv from "ajv";
import { BUILD, DATA_TOOLS, ENTITY, PRIMARY_MCP_PROTOCOL_VERSION } from "./registry.js";
import { TOOL_HANDLERS } from "./queries.js";
import { readResource, resourceInventory } from "./resources.js";

const ajv = new Ajv({ allErrors: true, strict: false });
const validators = new Map(DATA_TOOLS.map((tool) => [tool.id, ajv.compile(tool.inputSchema)]));

const annotations = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false };

const zodForProperty = (schema = {}) => {
  let base;
  if (schema.enum) base = z.enum(schema.enum);
  else if (schema.type === "integer") base = z.number().int();
  else if (schema.type === "number") base = z.number();
  else if (schema.type === "boolean") base = z.boolean();
  else base = z.string();
  if (schema.minimum !== undefined) base = base.min(schema.minimum);
  if (schema.maximum !== undefined) base = base.max(schema.maximum);
  if (schema.exclusiveMinimum !== undefined) base = base.gt(schema.exclusiveMinimum);
  return base;
};

const zodShapeFromJsonSchema = (schema) => {
  const required = new Set(schema.required ?? []);
  return Object.fromEntries(Object.entries(schema.properties ?? {}).map(([key, prop]) => {
    const value = zodForProperty(prop);
    return [key, required.has(key) ? value : value.optional()];
  }));
};

const errorResult = (message, details = undefined) => ({
  isError: true,
  content: [{ type: "text", text: details ? `${message} ${details}` : message }],
  structuredContent: { error: message, details }
});

const successResult = (result) => ({
  content: [{ type: "text", text: JSON.stringify(result) }],
  structuredContent: result
});

const conditioningDateError = (toolId) => errorResult(
  `${toolId} cannot perform date-range slicing because the public TrailGenic conditioning dataset is aggregate-only and contains no per-session rows. Omit start_date and end_date to receive the current aggregate dataset.`
);

export const createTrailgenicMcpServer = () => {
  const server = new McpServer({ name: ENTITY.name, version: BUILD.version }, {
    capabilities: { tools: {}, resources: {} },
    instructions: "TrailGenic public read-only aggregate MCP server.",
    protocolVersion: PRIMARY_MCP_PROTOCOL_VERSION
  });

  for (const tool of DATA_TOOLS) {
    const handler = TOOL_HANDLERS.get(tool.id);
    server.registerTool(tool.id, {
      title: tool.title,
      description: tool.description,
      inputSchema: zodShapeFromJsonSchema(tool.inputSchema),
      annotations
    }, async (args = {}) => {
      const validate = validators.get(tool.id);
      if (!validate(args)) {
        return errorResult("Invalid tool arguments.", ajv.errorsText(validate.errors));
      }
      if (tool.id.startsWith("tg.conditioning.") && (args.start_date || args.end_date)) {
        return conditioningDateError(tool.id);
      }
      try {
        return successResult(await handler(args));
      } catch (error) {
        return errorResult(error?.message ?? "Tool execution failed");
      }
    });
  }

  for (const resource of resourceInventory()) {
    server.registerResource(resource.name, resource.uri, {
      title: resource.title,
      description: resource.description,
      mimeType: resource.mimeType
    }, async (uri) => {
      const resourceUri = String(uri);
      const data = readResource(resourceUri);
      if (data === undefined) throw new Error(`Unknown TrailGenic resource: ${resourceUri}`);
      return { contents: [{ uri: resourceUri, mimeType: "application/json", text: JSON.stringify(data) }] };
    });
  }

  return server;
};
