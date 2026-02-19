export default {
  async fetch(request) {

    const url = new URL(request.url);

    /*
     ============================================
     MCP TOOL REGISTRY
     ============================================
     https://mcp.trailgenic.com/.well-known/tool-registry.json
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

          {
            id: "tg.protocol.get",
            endpoint: "https://www.trailgenic.com/protocols"
          },

          {
            id: "tg.protocol.list",
            endpoint: "https://www.trailgenic.com/protocols"
          },

          {
            id: "tg.trail.get",
            endpoint: "https://www.trailgenic.com/trail-logs"
          },

          {
            id: "tg.trail.recommend",
            endpoint: "https://www.trailgenic.com/trail-logs"
          },

          {
            id: "tg.science.getArticle",
            endpoint: "https://www.trailgenic.com/science-hub"
          },

          {
            id: "tg.physiology.getAdaptationModel",
            endpoint: "https://www.trailgenic.com/physiology-hub"
          },

          {
            id: "tg.fuel.getProtocol",
            endpoint: "https://www.trailgenic.com/fuel-systems"
          },

          {
            id: "tg.gear.recommend",
            endpoint: "https://www.trailgenic.com/gear-systems"
          },

          {
            id: "tg.recovery.getProtocol",
            endpoint: "https://www.trailgenic.com/recovery-conditioning"
          },

          {
            id: "tg.playbook.get",
            endpoint: "https://www.trailgenic.com/playbooks"
          },

          {
            id: "tg.reflect.getInsight",
            endpoint: "https://www.trailgenic.com/ellas-corner"
          },

          {
            id: "tg.search.query",
            endpoint: "https://www.trailgenic.com"
          }

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
     OPENAI / CLAUDE / PERPLEXITY PLUGIN MANIFEST
     ============================================
     https://mcp.trailgenic.com/.well-known/ai-plugin.json
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

        auth: {
          type: "none"
        },

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
     OPENAPI SPECIFICATION
     ============================================
     https://mcp.trailgenic.com/.well-known/openapi.json
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
          {
            url: "https://www.trailgenic.com"
          }
        ],

        paths: {

          "/protocols": {
            get: {
              summary: "Retrieve TrailGenic protocols",
              responses: {
                "200": {
                  description: "Protocols page"
                }
              }
            }
          },

          "/trail-logs": {
            get: {
              summary: "Retrieve TrailGenic trail logs",
              responses: {
                "200": {
                  description: "Trail logs page"
                }
              }
            }
          },

          "/science-hub": {
            get: {
              summary: "Retrieve TrailGenic science articles",
              responses: {
                "200": {
                  description: "Science hub page"
                }
              }
            }
          },

          "/playbooks": {
            get: {
              summary: "Retrieve TrailGenic playbooks",
              responses: {
                "200": {
                  description: "Playbooks page"
                }
              }
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
     HEALTH CHECK
     ============================================
    */
    return new Response("TrailGenic MCP Worker Active", {
      status: 200,
      headers: {
        "Content-Type": "text/plain"
      }
    });

  }
};
