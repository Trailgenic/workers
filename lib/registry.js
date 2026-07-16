import { DATASET_LIST, PHYSIOLOGY_MODULES } from "./datasets.js";
import { resourceInventory } from "./resources.js";

export const ENTITY = {
  name: "TrailGenic",
  domain: "https://trailgenic.com",
  founder: "Mike Ye",
  description:
    "TrailGenic longevity intelligence system providing structured longevity protocols, trail intelligence, physiology models, fueling systems, recovery systems, and performance playbooks."
};

export const BUILD = {
  version: "1.4.2",
  released: "2026-07-14"
};

export const MCP_ORIGIN = "https://mcp.trailgenic.com";
export const MCP_TRANSPORT = `${MCP_ORIGIN}/mcp`;
export const SUPPORTED_MCP_PROTOCOL_VERSIONS = ["2025-11-25", "2025-06-18"];
export const PRIMARY_MCP_PROTOCOL_VERSION = SUPPORTED_MCP_PROTOCOL_VERSIONS[0];

const noArgsSchema = {
  type: "object",
  properties: {},
  additionalProperties: false
};

const GEAR_INTEL_CATEGORIES = [
  "Backpacks",
  "Trail Shoes",
  "Insulation",
  "Trekking Poles",
  "Electrolytes",
  "Hydration",
  "Shell / Rain",
  "Headlamps"
];

const limitProperty = {
  type: "integer",
  minimum: 1,
  maximum: 200,
  description: "Maximum number of matching records to return."
};

export const DATA_TOOLS = [
  {
    id: "tg.datasets.index.get",
    title: "Get TrailGenic dataset catalog",
    description:
      "Return the generated catalog of enabled TrailGenic public datasets and preserved REST endpoints.",
    route: "/datasets/index",
    inputSchema: noArgsSchema
  },
  {
    id: "tg.ontology.get",
    title: "Get TrailGenic ontology entities",
    description:
      "Return TrailGenic ontology entities, optionally filtered by category.",
    route: "/datasets/ontology",
    inputSchema: {
      type: "object",
      properties: {
        category: { type: "string", description: "Ontology entity category." }
      },
      additionalProperties: false
    }
  },
  {
    id: "tg.protocols.get",
    title: "Get TrailGenic protocol kernel",
    description:
      "Return TrailGenic protocol kernel records, optionally filtered by protocol_id.",
    route: "/datasets/protocols",
    inputSchema: {
      type: "object",
      properties: {
        protocol_id: { type: "string", description: "Protocol identifier." }
      },
      additionalProperties: false
    }
  },
  {
    id: "tg.physiology.adaptation.get",
    title: "Get physiology adaptation module data",
    description:
      "Return a physiology adaptation module by slug, or the module list when no module is supplied. Without a module, the active module catalog is returned.",
    route: "/datasets/physiology-adaptation",
    inputSchema: {
      type: "object",
      properties: {
        module: {
          type: "string",
          enum: PHYSIOLOGY_MODULES.map((module) => module.slug),
          description: "Physiology module slug."
        }
      },
      additionalProperties: false
    }
  },

  {
    id: "tg.hiking.worldModel.get",
    title: "Get TrailGenic HikeWorldModel v2",
    description:
      "Return the aggregate-only TrailGenic HikeWorldModel™ v2.0 dataset, including 31-session hiking totals and Western Altitude Block summaries through Wheeler Peak.",
    route: "/datasets/hiking",
    inputSchema: noArgsSchema
  },
  {
    id: "tg.physiology.hrDriftAdaptation.get",
    title: "Get HR drift adaptation data",
    description:
      "Return the heart-rate drift adaptation dataset for sustained load and fitness progression.",
    route: "/datasets/physiology-adaptation/hr-drift-adaptation-vs-fitness",
    inputSchema: noArgsSchema
  },
  {
    id: "tg.nutrition.get",
    title: "Get TrailGenic nutrition records",
    description:
      "Return bounded nutrition records, optionally filtered by food category and TrailGenic fuel class.",
    route: "/datasets/nutrition",
    inputSchema: {
      type: "object",
      properties: {
        food_category: { type: "string", description: "Nutrition food_category value." },
        tg_fuel_class: { type: "string", description: "TrailGenic fuel class." },
        limit: limitProperty
      },
      additionalProperties: false
    }
  },
  {
    id: "tg.hydration.get",
    title: "Get TrailGenic hydration products",
    description:
      "Return bounded hydration/electrolyte products, optionally filtered by category.",
    route: "/datasets/hydration",
    inputSchema: {
      type: "object",
      properties: {
        category: { type: "string", description: "Hydration product category." },
        limit: limitProperty
      },
      additionalProperties: false
    }
  },
  {
    id: "tg.permits.dataset.get",
    title: "Get TrailGenic permit intelligence",
    description:
      "Return wilderness permit intelligence records, optionally filtered by scarcity tier.",
    route: "/datasets/permits",
    inputSchema: {
      type: "object",
      properties: {
        scarcity_tier: { type: "string", description: "Permit scarcity tier." }
      },
      additionalProperties: false
    }
  },
  {
    id: "tg.terrain.accessibleTrails.get",
    title: "Get accessible trail intelligence",
    description:
      "Return bounded accessible trail records, optionally filtered by region, accessibility class, or estimated protocol level.",
    route: "/datasets/terrain-intelligence/tg-accessible-trails-top100-v1",
    inputSchema: {
      type: "object",
      properties: {
        region: { type: "string", description: "Trail region." },
        accessibility_class: { type: "string", description: "Accessibility class." },
        protocol_level_estimate: { type: "string", description: "Estimated TrailGenic protocol level." },
        limit: limitProperty
      },
      additionalProperties: false
    }
  },
  {
    id: "tg.evidence.validationSummits.get",
    title: "Get validation summit evidence",
    description:
      "Return bounded validation summit records, optionally filtered by region.",
    route: "/datasets/evidence-validation",
    inputSchema: {
      type: "object",
      properties: {
        region: { type: "string", description: "Validation record region." },
        limit: limitProperty
      },
      additionalProperties: false
    }
  },
  {
    id: "tg.gear.intel.get",
    title: "Get gear intelligence",
    description:
      "Return bounded gear intelligence records, optionally filtered by category. This is the bounded, query-oriented compatibility gear tool.",
    route: "/datasets/gear/intel",
    inputSchema: {
      type: "object",
      properties: {
        category: { type: "string", description: "Gear category." },
        limit: limitProperty
      },
      additionalProperties: false
    }
  },
  {
    id: "tg.gear.getIntel",
    title: "Get TrailGenic Gear Intelligence dataset",
    description:
      "Returns the canonical full TrailGenic Gear Intelligence dataset — hiking gear scored through the TrailGenic longevity lens (fasted high-altitude performance, metabolic load, recovery impact, protocol fit). Optionally filter by exact gear category.",
    route: "/datasets/gear/intel",
    inputSchema: {
      type: "object",
      properties: {
        category: {
          type: "string",
          enum: GEAR_INTEL_CATEGORIES,
          description: "Optional exact gear category filter."
        }
      },
      additionalProperties: false
    }
  },
  {
    id: "tg.longevity.protocol.get",
    title: "Get longevity protocol intelligence",
    description:
      "Return longevity protocol intelligence, optionally filtered by protocol_id or category.",
    route: "/datasets/longevity/protocol",
    inputSchema: {
      type: "object",
      properties: {
        protocol_id: { type: "string", description: "Longevity protocol identifier." },
        category: { type: "string", description: "Longevity protocol category." }
      },
      additionalProperties: false
    }
  },
  {
    id: "tg.longevity.foundationSessions.get",
    title: "Get foundation phase session report",
    description:
      "Return the full TrailGenic Foundation Phase session report, including all 14 sessions.",
    route: "/datasets/longevity/foundation",
    inputSchema: noArgsSchema
  },

  {
    id: "tg.conditioning.walking.get",
    title: "Get aggregate walking conditioning findings",
    description:
      "Return aggregate-only walking conditioning findings, summary statistics, methodology, and claims. Does not return per-session data and is not a bio-age measure.",
    route: "/datasets/conditioning/walking",
    inputSchema: {
      type: "object",
      properties: {
        start_date: { type: "string", description: "Optional backward-compatible field. Supplying it returns an error because public data is aggregate-only and cannot be date-sliced." },
        end_date: { type: "string", description: "Optional backward-compatible field. Supplying it returns an error because public data is aggregate-only and cannot be date-sliced." }
      },
      additionalProperties: false
    }
  },
  {
    id: "tg.conditioning.rucking.get",
    title: "Get aggregate rucking conditioning findings",
    description:
      "Return aggregate-only rucking conditioning findings, summary statistics, methodology, and claims. Does not return per-session data and is not a bio-age measure.",
    route: "/datasets/conditioning/rucking",
    inputSchema: {
      type: "object",
      properties: {
        start_date: { type: "string", description: "Optional backward-compatible field. Supplying it returns an error because public data is aggregate-only and cannot be date-sliced." },
        end_date: { type: "string", description: "Optional backward-compatible field. Supplying it returns an error because public data is aggregate-only and cannot be date-sliced." }
      },
      additionalProperties: false
    }
  },
  {
    id: "tg.conditioning.running.get",
    title: "Get aggregate running conditioning findings",
    description:
      "Return aggregate-only running conditioning findings, summary statistics, methodology, and claims by distance tier. Does not return per-session data and is not a bio-age measure.",
    route: "/datasets/conditioning/running",
    inputSchema: {
      type: "object",
      properties: {
        start_date: { type: "string", description: "Optional backward-compatible field. Supplying it returns an error because public data is aggregate-only and cannot be date-sliced." },
        end_date: { type: "string", description: "Optional backward-compatible field. Supplying it returns an error because public data is aggregate-only and cannot be date-sliced." }
      },
      additionalProperties: false
    }
  },
  {
    id: "tg.longevity.bioAge.compute",
    title: "Compute trail-derived biological age",
    description:
      "Deterministic compute tool (not a dataset read). Estimates trail-derived biological age from one hike: VO2max from grade-adjusted effort versus heart-rate reserve, age-graded against population reference curves, then pooled with resting heart rate and optional overnight HRV. Hiking modality only; low-intensity Zone 1 efforts are flagged as unreliable. Invoked via tools/call; it has no REST dataset route, so its endpoint is the /mcp transport.",
    route: "/mcp",
    inputSchema: {
      type: "object",
      properties: {
        age: { type: "integer", minimum: 14, maximum: 100, description: "Chronological age in years." },
        resting_hr: { type: "integer", minimum: 35, maximum: 110, description: "Resting heart rate (bpm)." },
        distance_mi: { type: "number", exclusiveMinimum: 0, description: "Hike distance (miles)." },
        elevation_gain_ft: { type: "integer", minimum: 0, description: "Total elevation gain (feet)." },
        moving_time_min: { type: "number", exclusiveMinimum: 0, description: "Moving time (minutes)." },
        avg_hr: { type: "integer", minimum: 70, maximum: 210, description: "Average heart rate over the hike (bpm)." },
        max_hr: { type: "integer", minimum: 100, maximum: 220, description: "Known max heart rate (bpm). Optional; a Tanaka estimate is used if omitted." },
        overnight_hrv: { type: "integer", minimum: 5, maximum: 200, description: "Overnight heart-rate variability (ms). Optional; tightens the autonomic side of the estimate." },
        fasted: { type: "boolean", description: "Whether the hike was fasted (TrailGenic protocol flag; contextual, does not change the estimate)." }
      },
      required: ["age", "resting_hr", "distance_mi", "elevation_gain_ft", "moving_time_min", "avg_hr"],
      additionalProperties: false
    }
  }
];

// TODO: Add tg.longevity.registry.get and tg.longevity.validation.get to DATA_TOOLS
// when tg_longevity_registry_v1.json and tg_longevity_validation_v1.json contain real records.
export const DEFERRED_DATA_TOOLS = [
  "tg.longevity.registry.get",
  "tg.longevity.validation.get"
];

const content = (id, title, path) => ({
  id,
  title,
  url: path.startsWith("https://") ? path : `https://www.trailgenic.com${path}`
});

export const CONTENT_LINKS = [
  content("tg.protocol.get", "TrailGenic protocols", "/protocols"),
  content("tg.protocol.list", "TrailGenic protocol list", "/protocols"),
  content("tg.trail.get", "TrailGenic trail logs", "/trail-logs"),
  content("tg.trail.recommend", "TrailGenic trail recommendations", "/trail-logs"),
  content("tg.science.getArticle", "TrailGenic science hub", "/science-hub"),
  content("tg.physiology.getAdaptationModel", "TrailGenic physiology hub", "/physiology-hub"),
  content("tg.fuel.getProtocol", "TrailGenic fuel systems", "/fuel-systems"),
  content("tg.gear.recommend", "TrailGenic gear systems", "/gear-systems"),
  content("tg.recovery.getProtocol", "TrailGenic recovery conditioning", "/recovery-conditioning"),
  content("tg.playbook.get", "TrailGenic playbooks", "/playbooks"),
  content("tg.reflect.getInsight", "Ella's Corner", "/ellas-corner"),
  content("tg.search.query", "TrailGenic site search", "https://www.trailgenic.com")
];

export const datasetCatalog = () => ({
  dataset_catalog_version: "1.0",
  entity: {
    name: ENTITY.name,
    domain: ENTITY.domain,
    founder: ENTITY.founder
  },
  description:
    "Machine-readable catalog of TrailGenic structured datasets used for longevity intelligence, physiological modeling, trail intelligence, and performance protocols.",
  datasets: DATASET_LIST.filter((dataset) => dataset.enabled).map((dataset) => {
    const entry = {
      dataset_id: dataset.id,
      dataset_family: dataset.family,
      description: dataset.description,
      endpoint: `${MCP_ORIGIN}${dataset.endpoint}`,
      version: dataset.version
    };

    if (dataset.schema_source_path) {
      entry.schema_endpoint = `${entry.endpoint}/schema`;
    }

    if (dataset.aliases?.length) {
      entry.aliases = dataset.aliases.map((alias) => `${MCP_ORIGIN}${alias}`);
    }

    if (dataset.id === "tg_physiology_adaptation_v1") {
      entry.modules = PHYSIOLOGY_MODULES.map((module) => module.slug);
    }

    return entry;
  }),
  last_updated: BUILD.released
});

export const mcpTools = () => DATA_TOOLS.map((tool) => ({
  name: tool.id,
  id: tool.id,
  title: tool.title,
  description: tool.description,
  inputSchema: tool.inputSchema,
  annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }
}));

export const capabilitiesDocument = () => ({
  capability_version: "1.0",
  entity: ENTITY,
  mcp: {
    endpoint: MCP_ORIGIN,
    transport: MCP_TRANSPORT,
    registry: `${MCP_ORIGIN}/.well-known/tool-registry.json`,
    plugin: `${MCP_ORIGIN}/.well-known/ai-plugin.json`,
    openapi: `${MCP_ORIGIN}/.well-known/openapi.json`,
    auth: { type: "none" }
  },
  datasets: datasetCatalog(),
  tools: mcpTools().map((tool) => ({
    id: tool.id,
    name: tool.name,
    title: tool.title,
    description: tool.description,
    endpoint: `${MCP_ORIGIN}${DATA_TOOLS.find((entry) => entry.id === tool.id)?.route ?? "/mcp"}`,
    mcp_method: "tools/call",
    inputSchema: tool.inputSchema,
    annotations: tool.annotations
  })),
  resources: resourceInventory(),
  content_links: CONTENT_LINKS,
  deferred_tools: DEFERRED_DATA_TOOLS,
  trust_signals: {
    structured_outputs: true,
    deterministic_schema: true,
    machine_readable: true,
    agent_compatible: true
  },
  last_updated: BUILD.released
});

export const toolRegistryDocument = () => ({
  registry_version: "1.0",
  entity: ENTITY,
  discovery: {
    protocol: "MCP JSON-RPC 2.0 over Streamable HTTP-compatible POST",
    endpoint: `${MCP_ORIGIN}/.well-known/tool-registry.json`,
    transport: MCP_TRANSPORT,
    auth: { type: "none" }
  },
  tools: mcpTools().map((tool) => ({
    id: tool.id,
    name: tool.name,
    title: tool.title,
    description: tool.description,
    endpoint: `${MCP_ORIGIN}${DATA_TOOLS.find((entry) => entry.id === tool.id)?.route ?? "/mcp"}`,
    inputSchema: tool.inputSchema,
    annotations: tool.annotations
  })),
  resources: resourceInventory(),
  content_links: CONTENT_LINKS,
  deferred_tools: DEFERRED_DATA_TOOLS,
  last_updated: BUILD.released
});
