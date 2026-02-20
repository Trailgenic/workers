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
