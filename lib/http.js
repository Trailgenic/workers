export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "content-type, mcp-protocol-version"
};

export const withCors = (headers = {}) => ({
  ...corsHeaders,
  ...headers
});

export const jsonResponse = (body, init = {}) =>
  new Response(JSON.stringify(body, null, 2), {
    ...init,
    headers: withCors({
      "Content-Type": "application/json",
      "Cache-Control": init.cacheControl ?? "public, max-age=3600",
      ...(init.headers ?? {})
    })
  });

export const textResponse = (body, init = {}) =>
  new Response(body, {
    ...init,
    headers: withCors({
      "Content-Type": "text/plain",
      ...(init.headers ?? {})
    })
  });

export const emptyResponse = (init = {}) =>
  new Response(null, {
    ...init,
    headers: withCors(init.headers ?? {})
  });

export const optionsResponse = () => emptyResponse({ status: 204 });
