export const TRAILGENIC_WEBMCP_PROTOCOLS = String.raw`
(async function () {
  if (typeof document.modelContext?.registerTool !== "function") {
    console.info("[TrailGenic] WebMCP is not available in this browser.");
    return;
  }

  const ORIGIN = "https://mcp.trailgenic.com";
  const MODALITY_ENDPOINTS = {
    walking: "/datasets/conditioning/walking",
    rucking: "/datasets/conditioning/rucking",
    running: "/datasets/conditioning/running",
    hiking: "/datasets/hiking"
  };
  const CANONICAL_MODALITIES = Object.keys(MODALITY_ENDPOINTS);

  function exactObject(input, keys) {
    if (!input || typeof input !== "object" || Array.isArray(input)) {
      throw new TypeError("TrailGenic tool input must be an object.");
    }
    const supplied = Object.keys(input).sort();
    const expected = [...keys].sort();
    if (supplied.length !== expected.length || supplied.some((key, index) => key !== expected[index])) {
      throw new TypeError("TrailGenic tool input accepts exactly: " + expected.join(", ") + ".");
    }
  }

  async function getJson(path) {
    const response = await fetch(ORIGIN + path, { headers: { accept: "application/json" } });
    if (!response.ok) throw new Error("TrailGenic request failed (" + response.status + ").");
    return response.json();
  }

  function toolResult(result) {
    return {
      content: [{ type: "text", text: JSON.stringify(result) }],
      structuredContent: result
    };
  }

  function focusProtocol(protocol) {
    if (!protocol?.source_url) return;
    const targetPath = new URL(protocol.source_url).pathname;
    const link = Array.from(document.querySelectorAll("a[href]")).find(function (candidate) {
      return new URL(candidate.href, window.location.href).pathname === targetPath;
    });
    if (!link) return;
    if (typeof link.scrollIntoView === "function") link.scrollIntoView({ behavior: "smooth", block: "center" });
    if (typeof link.focus === "function") link.focus({ preventScroll: true });
  }

  function projectModality(modality, data) {
    if (modality === "hiking") {
      return {
        modality,
        dataset_id: data.dataset_id,
        version: data.version,
        status: data.status,
        session_count: data.summary_statistics?.hiking_sessions,
        observation_window: data.observation_window,
        scope: data.scope,
        summary_statistics: data.summary_statistics,
        methodology: data.methodology,
        claims: data.claims,
        caveats: data.caveats,
        privacy_scope: data.privacy_scope
      };
    }

    const record = Array.isArray(data.records) ? data.records[0] : null;
    return {
      modality,
      dataset_id: data.dataset_id,
      version: data.version,
      status: data.status,
      session_count: data.existence_metadata?.session_count,
      observation_window: data.existence_metadata?.date_range,
      protocol_context: data.existence_metadata?.protocol_context,
      aggregate_finding: record?.aggregate_finding,
      summary_statistics: record?.summary_statistics,
      methodology: record?.methodology,
      claims: record?.claims,
      privacy_scope: data.privacy_scope
    };
  }

  const tools = [
    {
      name: "get_trailgenic_protocol",
      title: "Get TrailGenic Protocol",
      description: "Retrieve one canonical TrailGenic protocol level, including its purpose, planned dose range, expected observations, progression gate, Governor, evidence boundary, and source page. The result is educational and does not diagnose, prescribe, or provide medical clearance.",
      inputSchema: {
        type: "object",
        properties: {
          protocol_level: {
            type: "integer",
            minimum: 1,
            maximum: 5,
            description: "Canonical TrailGenic protocol level from 1 (Foundation) through 5 (TrailGenic)."
          }
        },
        required: ["protocol_level"],
        additionalProperties: false
      },
      annotations: { readOnlyHint: true },
      execute: async function (input) {
        exactObject(input, ["protocol_level"]);
        if (!Number.isInteger(input.protocol_level) || input.protocol_level < 1 || input.protocol_level > 5) {
          throw new TypeError("protocol_level must be an integer from 1 through 5.");
        }
        const data = await getJson("/datasets/protocols");
        const protocol = data.protocols?.find(function (item) {
          return item.protocol_sequence === input.protocol_level;
        });
        if (!protocol) throw new Error("TrailGenic protocol level was not found.");
        focusProtocol(protocol);
        return toolResult({
          completed: true,
          product: "TrailGenic Protocol Series",
          dataset_id: data.dataset_id,
          version: data.version,
          protocol,
          governor: data.governor,
          scope: data.scope,
          evidence_boundary: data.evidence_boundary,
          disclaimer: "Educational movement-system reference only; not medical advice, diagnosis, treatment, prescription, readiness clearance, or emergency guidance."
        });
      }
    },
    {
      name: "compare_trailgenic_modalities",
      title: "Compare TrailGenic Modalities",
      description: "Compare public aggregate evidence for two to four canonical TrailGenic modalities: Walking, Rucking, Running, and Hiking. Results preserve each dataset's methodology and claim boundaries; they do not rank modalities or infer individualized readiness.",
      inputSchema: {
        type: "object",
        properties: {
          modalities: {
            type: "array",
            minItems: 2,
            maxItems: 4,
            uniqueItems: true,
            items: { type: "string", enum: ["walking", "rucking", "running", "hiking"] },
            description: "Two to four unique canonical TrailGenic modalities to compare."
          }
        },
        required: ["modalities"],
        additionalProperties: false
      },
      annotations: { readOnlyHint: true },
      execute: async function (input) {
        exactObject(input, ["modalities"]);
        if (!Array.isArray(input.modalities) || input.modalities.length < 2 || input.modalities.length > 4) {
          throw new TypeError("modalities must contain two to four values.");
        }
        const modalities = input.modalities.map(function (value) { return String(value).toLowerCase(); });
        if (new Set(modalities).size !== modalities.length || modalities.some(function (value) { return !CANONICAL_MODALITIES.includes(value); })) {
          throw new TypeError("modalities must be unique values from walking, rucking, running, and hiking.");
        }
        const datasets = await Promise.all(modalities.map(function (modality) {
          return getJson(MODALITY_ENDPOINTS[modality]);
        }));
        return toolResult({
          completed: true,
          product: "TrailGenic Movement Architecture",
          canonical_modalities: CANONICAL_MODALITIES,
          compared_modalities: modalities,
          results: modalities.map(function (modality, index) {
            return projectModality(modality, datasets[index]);
          }),
          comparison_boundary: "These datasets use different session designs, stressors, routes, durations, and descriptive metrics. Compare each modality's role, dose, context, and observed response; do not rank them as interchangeable fitness tests.",
          privacy_boundary: "Public aggregates and selected scrubbed observations only; no raw telemetry, unpublished session rows, or precise personal locations.",
          disclaimer: "Educational n-of-1 field evidence only; not medical advice, diagnosis, treatment, prescription, readiness clearance, or population-level proof."
        });
      }
    }
  ];

  const registeredTools = [];
  for (const tool of tools) {
    try {
      await document.modelContext.registerTool(tool);
      registeredTools.push(tool.name);
      console.info("[TrailGenic] WebMCP tool registered: " + tool.name);
    } catch (error) {
      console.error("[TrailGenic] WebMCP tool registration failed: " + tool.name, error);
    }
  }

  window.__trailgenicWebMCP = {
    version: "1.0",
    surface: "protocols",
    tools: registeredTools
  };
})();
`;
