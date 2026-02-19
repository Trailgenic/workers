export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (url.pathname === "/.well-known/tool-registry.json") {

      const registry = {
        registry_version: "1.0",

        entity: {
          name: "TrailGenic",
          domain: "https://www.trailgenic.com",
          description: "TrailGenic longevity intelligence system providing protocols, trail intelligence, physiology models, fueling systems, and recovery strategies.",
          founder: "Mike Ye"
        },

        discovery: {
  protocol: "WebMCP",
  endpoint: "https://mcp.trailgenic.com/.well-known/tool-registry.json"
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

    return new Response("TrailGenic Worker Active", {
      status: 200
    });
  }
};
