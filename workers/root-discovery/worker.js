export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (url.pathname === "/.well-known/tool-registry.json") {
      const pointer = {
        registry_version: "1.0",
        entity: {
          name: "TrailGenic",
          domain: "https://trailgenic.com",
          founder: "Mike Ye"
        },
        discovery: {
          protocol: "WebMCP",
          endpoint: "https://mcp.trailgenic.com/.well-known/tool-registry.json"
        }
      };

      return new Response(JSON.stringify(pointer, null, 2), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "public, max-age=3600"
        }
      });
    }

    return fetch(request);
  }
};
