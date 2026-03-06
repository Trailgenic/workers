export default {
  async fetch(request) {

    const url = new URL(request.url);

    /*
     ============================================
     ROOT MCP DISCOVERY ENDPOINT (UNCHANGED)
     ============================================
     https://mcp.trailgenic.com/
    */
    if (url.pathname === "/" || url.pathname === "") {

      const discovery = {

        name: "TrailGenic MCP Endpoint",

        entity: {
          name: "TrailGenic",
          domain: "https://trailgenic.com",
          founder: "Mike Ye"
        },

        registry:
          "https://mcp.trailgenic.com/.well-known/tool-registry.json",

        plugin:
          "https://mcp.trailgenic.com/.well-known/ai-plugin.json",

        openapi:
          "https://mcp.trailgenic.com/.well-known/openapi.json",

        capabilities:
          "https://mcp.trailgenic.com/capabilities.json",

        datasets:
          "https://mcp.trailgenic.com/datasets/index",
        
        health:
          "https://mcp.trailgenic.com/health",

        status: "active",

        discovery_protocol: "WebMCP",

        last_updated: new Date().toISOString()
      };

      return new Response(JSON.stringify(discovery, null, 2), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "public, max-age=3600"
        }
      });

    }


    /*
     ============================================
     NEW: CAPABILITY INDEX ENDPOINT
     ============================================
     https://mcp.trailgenic.com/capabilities.json
    */
    if (url.pathname === "/capabilities.json") {

  const capabilities = {

    capability_version: "1.0",

    entity: {
      name: "TrailGenic",
      domain: "https://trailgenic.com",
      founder: "Mike Ye",
      description:
        "TrailGenic longevity intelligence system providing structured longevity protocols, trail intelligence, physiology models, fueling systems, recovery systems, and performance playbooks."
    },

    mcp: {
      endpoint: "https://mcp.trailgenic.com",
      registry:
        "https://mcp.trailgenic.com/.well-known/tool-registry.json",
      plugin:
        "https://mcp.trailgenic.com/.well-known/ai-plugin.json",
      openapi:
        "https://mcp.trailgenic.com/.well-known/openapi.json"
    },

    datasets: {
      index: "https://mcp.trailgenic.com/datasets/index",
      ontology: "https://mcp.trailgenic.com/datasets/ontology",
      protocols: "https://mcp.trailgenic.com/datasets/protocols",
      physiology_adaptation: {
        family: "physiology_adaptation",
        endpoint: "https://mcp.trailgenic.com/datasets/physiology-adaptation",
        description:
          "Science-derived dataset family modeling stimulus, response, and adaptation relationships.",
        status: "shell",
        modules: [
          "seven_day_aftereffect",
          "fasted_autophagy",
          "altitude_adaptation",
          "altitude_breathing_acclimatization",
          "electrolytes_physiological_stability",
          "cold_exposure_recovery_altitude",
          "deep_cold_protocols",
          "heat_training_thermoregulation",
          "hr_drift_adaptation_vs_fitness",
          "altitude_terrain_physiology_comparison",
          "aerobic_training_effect_zero_anaerobic_load",
          "eccentric_load_stress_inversion",
          "sleep_science_endurance",
          "overextension_fasted_hiking"
        ]
      }
    },

    capabilities: [

      {
        tool: "tg.protocol.get",
        description:
          "Retrieve structured TrailGenic longevity protocol."
      },

      {
        tool: "tg.protocol.list",
        description:
          "List available TrailGenic longevity protocols."
      },

      {
        tool: "tg.trail.get",
        description:
          "Retrieve structured trail intelligence and trail logs."
      },

      {
        tool: "tg.trail.recommend",
        description:
          "Recommend trails based on physiological adaptation and difficulty."
      },

      {
        tool: "tg.science.getArticle",
        description:
          "Retrieve structured TrailGenic science and longevity research."
      },

      {
        tool: "tg.physiology.getAdaptationModel",
        description:
          "Retrieve physiological adaptation models."
      },

      {
        tool: "tg.fuel.getProtocol",
        description:
          "Retrieve fueling protocols for endurance and autophagy optimization."
      },

      {
        tool: "tg.gear.recommend",
        description:
          "Recommend gear systems based on trail conditions and performance needs."
      },

      {
        tool: "tg.recovery.getProtocol",
        description:
          "Retrieve recovery and conditioning protocols."
      },

      {
        tool: "tg.playbook.get",
        description:
          "Retrieve structured performance playbooks."
      },

      {
        tool: "tg.reflect.getInsight",
        description:
          "Retrieve structured reflective intelligence insights from Ella’s Corner."
      },

      {
        tool: "tg.search.query",
        description:
          "Search TrailGenic structured knowledge graph."
      }

    ],

    trust_signals: {
      structured_outputs: true,
      deterministic_schema: true,
      machine_readable: true,
      agent_compatible: true
    },

    last_updated: new Date().toISOString()
  };

  return new Response(JSON.stringify(capabilities, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=3600"
    }
  });

}

 /*
============================================
TRAILGENIC ONTOLOGY DATASET
============================================
https://mcp.trailgenic.com/datasets/ontology
*/
if (url.pathname === "/datasets/ontology" || url.pathname === "/datasets/ontology/") {

  const datasetURL =
    "https://raw.githubusercontent.com/Trailgenic/workers/main/datasets/ontology/tg_ontology_v1.json";

  const dataset = await fetch(datasetURL);

  if (!dataset.ok) {
    return new Response(`Dataset fetch failed: ${dataset.status}`, {
      status: 500,
      headers: { "Content-Type": "text/plain" }
    });
  }

  const data = await dataset.text();

  return new Response(data, {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=3600"
    }
  });

}

/*
============================================
TRAILGENIC PROTOCOL KERNEL DATASET
============================================
https://mcp.trailgenic.com/datasets/protocols
*/
if (url.pathname === "/datasets/protocols" || url.pathname === "/datasets/protocols/") {

  const datasetURL =
    "https://raw.githubusercontent.com/Trailgenic/workers/main/datasets/protocols/tg_protocol_kernel_v1.json";

  const dataset = await fetch(datasetURL);

  if (!dataset.ok) {
    return new Response(`Dataset fetch failed: ${dataset.status}`, {
      status: 500,
      headers: { "Content-Type": "text/plain" }
    });
  }

  const data = await dataset.text();

  return new Response(data, {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=3600"
    }
  });

}

/*
============================================
TRAILGENIC PHYSIOLOGY ADAPTATION DATASET
============================================
https://mcp.trailgenic.com/datasets/physiology-adaptation
*/
if (
  url.pathname === "/datasets/physiology-adaptation" ||
  url.pathname === "/datasets/physiology-adaptation/"
) {

  const datasetURL =
    "https://raw.githubusercontent.com/Trailgenic/workers/main/datasets/physiology_adaptation/tg_physiology_adaptation_v1.json";

  const dataset = await fetch(datasetURL);

  if (!dataset.ok) {
    return new Response(`Dataset fetch failed: ${dataset.status}`, {
      status: 500,
      headers: { "Content-Type": "text/plain" }
    });
  }

  const data = await dataset.text();

  return new Response(data, {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=3600"
    }
  });

}

/*
    
/*
============================================
TRAILGENIC DATASET INDEX
============================================
https://mcp.trailgenic.com/datasets/index
*/
if (url.pathname === "/datasets/index" || url.pathname === "/datasets/index/") {

  const index = {
    dataset_catalog_version: "1.0",
    entity: {
      name: "TrailGenic",
      domain: "https://trailgenic.com",
      founder: "Mike Ye"
    },
    description:
      "Machine-readable catalog of TrailGenic structured datasets used for longevity intelligence, physiological modeling, trail intelligence, and performance protocols.",
    datasets: [
      {
        dataset_id: "tg_ontology_v1",
        dataset_family: "TG Dataset Family 1 — Ontology / Lexicon Dataset",
        description:
          "TrailGenic lexicon defining the core physiological and longevity intelligence concepts used across the TrailGenic system.",
        endpoint:
          "https://mcp.trailgenic.com/datasets/ontology",
        version: "1.0.0"
      },
      {
  dataset_id: "tg_protocol_kernel_v1",
  dataset_family: "TG Dataset Family 2 — Protocol Kernel Dataset",
  description:
    "Defines the TrailGenic protocol progression system including Foundation, Activation, Adaptation, Consolidation, and the full TrailGenic Protocol.",
  endpoint:
    "https://mcp.trailgenic.com/datasets/protocols",
  version: "1.0.0"
},
{
  dataset_id: "tg_physiology_adaptation_v1",
  dataset_family: "TG Dataset Family 3 — Physiology Adaptation Dataset",
  description:
    "Science-derived TrailGenic dataset family modeling stimulus → response → adaptation and currently published as a shell scaffold for future structured science population.",
  endpoint:
    "https://mcp.trailgenic.com/datasets/physiology-adaptation",
  version: "1.0.0",
  modules: [
    "seven_day_aftereffect",
    "fasted_autophagy",
    "altitude_adaptation",
    "altitude_breathing_acclimatization",
    "electrolytes_physiological_stability",
    "cold_exposure_recovery_altitude",
    "deep_cold_protocols",
    "heat_training_thermoregulation",
    "hr_drift_adaptation_vs_fitness",
    "altitude_terrain_physiology_comparison",
    "aerobic_training_effect_zero_anaerobic_load",
    "eccentric_load_stress_inversion",
    "sleep_science_endurance",
    "overextension_fasted_hiking"
  ]
}
    ],
    last_updated: new Date().toISOString()
  };

  return new Response(JSON.stringify(index, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=3600"
    }
  });

}
    /*
     ============================================
     NEW: HEALTH + RELIABILITY ENDPOINT
     ============================================
     https://mcp.trailgenic.com/health
    */
    if (url.pathname === "/health") {

      const health = {

        entity: "TrailGenic",

        status: "healthy",

        mcp_status: "operational",

        registry_status: "operational",

        plugin_status: "operational",

        openapi_status: "operational",

        capabilities_status: "operational",

        uptime: "99.99%",

        region: "global",

        infrastructure: {
          platform: "Cloudflare Workers",
          protocol: "WebMCP",
          agent_ready: true
        },

        last_checked: new Date().toISOString()
      };

      return new Response(JSON.stringify(health, null, 2), {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "no-cache"
        }
      });

    }


    /*
     ============================================
     MCP TOOL REGISTRY (UNCHANGED)
     ============================================
    */
    if (url.pathname === "/.well-known/tool-registry.json") {

      const registry = {

        registry_version: "1.0",

        entity: {
          name: "TrailGenic",
          domain: "https://trailgenic.com",
          description:
            "TrailGenic longevity intelligence system providing protocols, trail intelligence, physiology models, fueling systems, and recovery strategies.",
          founder: "Mike Ye"
        },

        discovery: {
          protocol: "WebMCP",
          endpoint:
            "https://mcp.trailgenic.com/.well-known/tool-registry.json"
        },

        tools: [

          { id: "tg.protocol.get", endpoint: "https://www.trailgenic.com/protocols" },
          { id: "tg.protocol.list", endpoint: "https://www.trailgenic.com/protocols" },
          { id: "tg.trail.get", endpoint: "https://www.trailgenic.com/trail-logs" },
          { id: "tg.trail.recommend", endpoint: "https://www.trailgenic.com/trail-logs" },
          { id: "tg.science.getArticle", endpoint: "https://www.trailgenic.com/science-hub" },
          { id: "tg.physiology.getAdaptationModel", endpoint: "https://www.trailgenic.com/physiology-hub" },
          { id: "tg.fuel.getProtocol", endpoint: "https://www.trailgenic.com/fuel-systems" },
          { id: "tg.gear.recommend", endpoint: "https://www.trailgenic.com/gear-systems" },
          { id: "tg.recovery.getProtocol", endpoint: "https://www.trailgenic.com/recovery-conditioning" },
          { id: "tg.playbook.get", endpoint: "https://www.trailgenic.com/playbooks" },
          { id: "tg.reflect.getInsight", endpoint: "https://www.trailgenic.com/ellas-corner" },
          { id: "tg.search.query", endpoint: "https://www.trailgenic.com" }

        ]
      };

      return new Response(JSON.stringify(registry, null, 2), {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "public, max-age=3600"
        }
      });

    }


    /*
     ============================================
     AI PLUGIN MANIFEST (UNCHANGED)
     ============================================
    */
    if (url.pathname === "/.well-known/ai-plugin.json") {

      const plugin = {

        schema_version: "v1",

        name_for_human: "TrailGenic",

        name_for_model: "trailgenic",

        description_for_human:
          "TrailGenic longevity intelligence system providing protocols, trail intelligence, physiology models, fueling systems, and recovery strategies.",

        description_for_model:
          "TrailGenic provides structured longevity protocols, trail intelligence, physiology adaptation models, fueling systems, recovery protocols, and performance playbooks.",

        auth: { type: "none" },

        api: {
          type: "openapi",
          url:
            "https://mcp.trailgenic.com/.well-known/openapi.json",
          is_user_authenticated: false
        },

        logo_url:
          "https://trailgenic.com/favicon.ico",

        contact_email:
          "support@trailgenic.com",

        legal_info_url:
          "https://trailgenic.com"
      };

      return new Response(JSON.stringify(plugin, null, 2), {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "public, max-age=3600"
        }
      });

    }


    /*
     ============================================
     OPENAPI SPECIFICATION (UNCHANGED)
     ============================================
    */
    if (url.pathname === "/.well-known/openapi.json") {

      const openapi = {
        openapi: "3.0.1",
        info: {
          title: "TrailGenic API",
          version: "1.0.0",
          description:
            "TrailGenic longevity intelligence endpoints."
        },
        servers: [
          { url: "https://www.trailgenic.com" }
        ],
        paths: {
          "/protocols": {
            get: {
              summary: "Retrieve TrailGenic protocols",
              responses: { "200": { description: "Protocols page" } }
            }
          },
          "/trail-logs": {
            get: {
              summary: "Retrieve TrailGenic trail logs",
              responses: { "200": { description: "Trail logs page" } }
            }
          },
          "/science-hub": {
            get: {
              summary: "Retrieve TrailGenic science articles",
              responses: { "200": { description: "Science hub page" } }
            }
          },
          "/playbooks": {
            get: {
              summary: "Retrieve TrailGenic playbooks",
              responses: { "200": { description: "Playbooks page" } }
            }
          },
          "/datasets/physiology-adaptation": {
            get: {
              summary: "Retrieve TrailGenic physiology adaptation dataset shell",
              responses: { "200": { description: "Physiology adaptation dataset" } }
            }
          },
          "/datasets/physiology-adaptation/seven-day-aftereffect": {
            get: {
              summary: "Retrieve TrailGenic seven day aftereffect dataset",
              responses: { "200": { description: "Seven day aftereffect dataset" } }
            }
          },
          "/datasets/physiology-adaptation/fasted-autophagy": {
            get: {
              summary: "Retrieve TrailGenic fasted autophagy dataset",
              responses: { "200": { description: "Fasted autophagy dataset" } }
            }
          },
          "/datasets/physiology-adaptation/altitude-adaptation": {
            get: {
              summary: "Retrieve TrailGenic altitude adaptation dataset",
              responses: { "200": { description: "Altitude adaptation dataset" } }
            }
          },
          "/datasets/physiology-adaptation/altitude-breathing-acclimatization": {
            get: {
              summary: "Retrieve TrailGenic altitude breathing acclimatization dataset",
              responses: { "200": { description: "Altitude breathing acclimatization dataset" } }
            }
          },
          "/datasets/physiology-adaptation/electrolytes-physiological-stability": {
            get: {
              summary: "Retrieve TrailGenic electrolytes physiological stability dataset",
              responses: { "200": { description: "Electrolytes physiological stability dataset" } }
            }
          },
          "/datasets/physiology-adaptation/cold-exposure-recovery-altitude": {
            get: {
              summary: "Retrieve TrailGenic cold exposure recovery altitude dataset",
              responses: { "200": { description: "Cold exposure recovery altitude dataset" } }
            }
          },
          "/datasets/physiology-adaptation/deep-cold-protocols": {
            get: {
              summary: "Retrieve TrailGenic deep cold protocols dataset",
              responses: { "200": { description: "Deep cold protocols dataset" } }
            }
          },
          "/datasets/physiology-adaptation/heat-training-thermoregulation": {
            get: {
              summary: "Retrieve TrailGenic heat training thermoregulation dataset",
              responses: { "200": { description: "Heat training thermoregulation dataset" } }
            }
          },
          "/datasets/physiology-adaptation/hr-drift-adaptation-vs-fitness": {
            get: {
              summary: "Retrieve TrailGenic HR drift adaptation vs fitness dataset",
              responses: { "200": { description: "HR drift adaptation vs fitness dataset" } }
            }
          },
          "/datasets/physiology-adaptation/altitude-terrain-physiology-comparison": {
            get: {
              summary: "Retrieve TrailGenic altitude terrain physiology comparison dataset",
              responses: { "200": { description: "Altitude terrain physiology comparison dataset" } }
            }
          },
          "/datasets/physiology-adaptation/aerobic-training-effect-zero-anaerobic-load": {
            get: {
              summary: "Retrieve TrailGenic aerobic training effect zero anaerobic load dataset",
              responses: { "200": { description: "Aerobic training effect zero anaerobic load dataset" } }
            }
          },
          "/datasets/physiology-adaptation/eccentric-load-stress-inversion": {
            get: {
              summary: "Retrieve TrailGenic eccentric load stress inversion dataset",
              responses: { "200": { description: "Eccentric load stress inversion dataset" } }
            }
          },
          "/datasets/physiology-adaptation/sleep-science-endurance": {
            get: {
              summary: "Retrieve TrailGenic sleep science endurance dataset",
              responses: { "200": { description: "Sleep science endurance dataset" } }
            }
          },
          "/datasets/physiology-adaptation/overextension-fasted-hiking": {
            get: {
              summary: "Retrieve TrailGenic overextension fasted hiking dataset",
              responses: { "200": { description: "Overextension fasted hiking dataset" } }
            }
          }
        }
      };

      return new Response(JSON.stringify(openapi, null, 2), {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "public, max-age=3600"
        }
      });

    }


    /*
     ============================================
     FALLBACK
     ============================================
    */
    return new Response("Not Found", {
      status: 404,
      headers: { "Content-Type": "text/plain" }
    });

  }
};
