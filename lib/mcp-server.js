import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { BUILD, DATA_TOOLS, ENTITY, PRIMARY_MCP_PROTOCOL_VERSION } from "./registry.js";
import { TOOL_HANDLERS } from "./queries.js";
import { readResource, resourceInventory } from "./resources.js";

const annotations = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false };

const JSON_SCHEMA_KEYWORDS = new Set([
  "additionalProperties",
  "description",
  "enum",
  "exclusiveMaximum",
  "exclusiveMinimum",
  "items",
  "maxItems",
  "maxLength",
  "maximum",
  "minItems",
  "minLength",
  "minimum",
  "pattern",
  "properties",
  "required",
  "type"
]);

const assertSupportedSchema = (schema = {}, path = "schema") => {
  for (const keyword of Object.keys(schema)) {
    if (!JSON_SCHEMA_KEYWORDS.has(keyword)) throw new Error(`Unsupported JSON Schema keyword at ${path}: ${keyword}`);
  }
  if (schema.type === "object") {
    for (const [key, property] of Object.entries(schema.properties ?? {})) {
      assertSupportedSchema(property, `${path}.properties.${key}`);
    }
  }
  if (schema.type === "array" && schema.items) assertSupportedSchema(schema.items, `${path}.items`);
};

const zodForProperty = (schema = {}, path = "schema") => {
  assertSupportedSchema(schema, path);
  let base;
  if (schema.enum) {
    if (!Array.isArray(schema.enum) || schema.enum.length === 0) {
      throw new Error(`Unsupported empty enum at ${path}`);
    }
    base = z.enum(schema.enum);
  } else if (schema.type === "integer") base = z.number().int();
  else if (schema.type === "number") base = z.number();
  else if (schema.type === "boolean") base = z.boolean();
  else if (schema.type === "array") base = z.array(zodForProperty(schema.items ?? {}, `${path}.items`));
  else if (schema.type === "object") base = zodObjectFromJsonSchema(schema, path);
  else if (schema.type === "string" || schema.type === undefined) base = z.string();
  else throw new Error(`Unsupported JSON Schema type at ${path}: ${schema.type}`);

  if (schema.minimum !== undefined) base = base.min(schema.minimum);
  if (schema.maximum !== undefined) base = base.max(schema.maximum);
  if (schema.exclusiveMinimum !== undefined) base = base.gt(schema.exclusiveMinimum);
  if (schema.exclusiveMaximum !== undefined) base = base.lt(schema.exclusiveMaximum);
  if (schema.minLength !== undefined) base = base.min(schema.minLength);
  if (schema.maxLength !== undefined) base = base.max(schema.maxLength);
  if (schema.pattern !== undefined) base = base.regex(new RegExp(schema.pattern));
  if (schema.minItems !== undefined) base = base.min(schema.minItems);
  if (schema.maxItems !== undefined) base = base.max(schema.maxItems);
  if (schema.description) base = base.describe(schema.description);
  return base;
};

const zodObjectFromJsonSchema = (schema, path = "schema") => {
  assertSupportedSchema(schema, path);
  if (schema.type !== "object") throw new Error(`Expected object schema at ${path}`);
  const required = new Set(schema.required ?? []);
  const shape = Object.fromEntries(Object.entries(schema.properties ?? {}).map(([key, prop]) => {
    const value = zodForProperty(prop, `${path}.properties.${key}`);
    return [key, required.has(key) ? value : value.optional()];
  }));
  const objectSchema = z.object(shape);
  return schema.additionalProperties === false ? objectSchema.strict() : objectSchema;
};

const formatZodIssues = (issues = []) => issues.map((issue) => {
  const path = issue.path?.length ? issue.path.join(".") : "arguments";
  return `${path}: ${issue.message}`;
}).join("; ");

const toolSchemas = new Map(DATA_TOOLS.map((tool) => [tool.id, zodObjectFromJsonSchema(tool.inputSchema, `tool ${tool.id}`)]));

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
  `${toolId} cannot perform date-range slicing because the public TrailGenic conditioning dataset contains aggregates plus selected observations, not a complete row set. Omit start_date and end_date to receive the current public dataset.`
);

export const createTrailgenicMcpServer = () => {
  const server = new McpServer({ name: ENTITY.name, version: BUILD.version }, {
    capabilities: { tools: {}, resources: {} },
    instructions: "TrailGenic public read-only MCP server for canonical aggregates, selected scrubbed observations, protocols, and explicitly bounded n-of-1 claims.",
    protocolVersion: PRIMARY_MCP_PROTOCOL_VERSION
  });

  for (const tool of DATA_TOOLS) {
    const handler = TOOL_HANDLERS.get(tool.id);
    server.registerTool(tool.id, {
      title: tool.title,
      description: tool.description,
      inputSchema: toolSchemas.get(tool.id),
      annotations
    }, async (args = {}) => {
      const parsed = toolSchemas.get(tool.id).safeParse(args);
      if (!parsed.success) {
        return errorResult(`Schema validation failed for ${tool.id}.`, formatZodIssues(parsed.error.issues));
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
