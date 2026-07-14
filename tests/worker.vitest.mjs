import { describe, it, expect } from 'vitest';
import worker from '../tool-registry/worker.js';

describe('worker http behavior', () => {
  it('serves root discovery', async () => {
    const res = await worker.fetch(new Request('https://mcp.trailgenic.com/'), {});
    expect(res.status).toBe(200);
    expect((await res.json()).tools.length).toBe(19);
  });
  it('keeps GET and OPTIONS /mcp contract', async () => {
    const get = await worker.fetch(new Request('https://mcp.trailgenic.com/mcp'), {});
    expect(get.status).toBe(405);
    expect(get.headers.get('Allow')).toBe('POST');
    const opt = await worker.fetch(new Request('https://mcp.trailgenic.com/mcp', { method: 'OPTIONS' }), {});
    expect(opt.status).toBe(204);
  });
  it('rejects bad accept, content type, and origin', async () => {
    const body = JSON.stringify({ jsonrpc:'2.0', id:1, method:'ping' });
    expect((await worker.fetch(new Request('https://mcp.trailgenic.com/mcp', { method:'POST', body, headers:{ 'Content-Type':'text/plain' } }), {})).status).toBe(415);
    expect((await worker.fetch(new Request('https://mcp.trailgenic.com/mcp', { method:'POST', body, headers:{ 'Content-Type':'application/json', Accept:'text/event-stream' } }), {})).status).toBe(406);
    expect((await worker.fetch(new Request('https://mcp.trailgenic.com/mcp', { method:'POST', body, headers:{ 'Content-Type':'application/json', Origin:'https://evil.example' } }), {})).status).toBe(403);
  });
});

describe('mcp transport through official SDK in workerd', () => {
  const post = (body, headers = {}) =>
    worker.fetch(new Request('https://mcp.trailgenic.com/mcp', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json', ...headers }
    }), {});

  it('normalizes JSON-only Accept and answers ping through the SDK', async () => {
    const res = await post({ jsonrpc: '2.0', id: 1, method: 'ping' }, { Accept: 'application/json' });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.result).toBeDefined();
    expect(data.error).toBeUndefined();
  });

  it('handles missing Accept header', async () => {
    const res = await post({ jsonrpc: '2.0', id: 2, method: 'ping' });
    expect(res.status).toBe(200);
  });

  it('negotiates both supported protocol versions and rejects fabricated ones', async () => {
    for (const v of ['2025-11-25', '2025-06-18']) {
      const res = await post({ jsonrpc: '2.0', id: 3, method: 'initialize',
        params: { protocolVersion: v, capabilities: {}, clientInfo: { name: 't', version: '1' } } },
        { Accept: 'application/json, text/event-stream' });
      const data = await res.json();
      expect(data.result.protocolVersion).toBe(v);
    }
    const bad = await post({ jsonrpc: '2.0', id: 4, method: 'initialize',
      params: { protocolVersion: '2031-01-01', capabilities: {}, clientInfo: { name: 't', version: '1' } } },
      { Accept: 'application/json, text/event-stream' });
    const badData = await bad.json();
    const negotiated = badData.result?.protocolVersion;
    expect(negotiated).not.toBe('2031-01-01');
  });

  it('lists exactly 19 tools and calls one end to end', async () => {
    const list = await post({ jsonrpc: '2.0', id: 5, method: 'tools/list', params: {} }, { Accept: 'application/json' });
    const tools = (await list.json()).result.tools;
    expect(tools.length).toBe(19);
    const call = await post({ jsonrpc: '2.0', id: 6, method: 'tools/call',
      params: { name: 'tg.datasets.index.get', arguments: {} } }, { Accept: 'application/json' });
    const result = (await call.json()).result;
    expect(result.structuredContent).toBeDefined();
    expect(result.isError).not.toBe(true);
  });

  it('serves resources through the SDK', async () => {
    const list = await post({ jsonrpc: '2.0', id: 7, method: 'resources/list', params: {} }, { Accept: 'application/json' });
    const resources = (await list.json()).result.resources;
    expect(resources.length).toBeGreaterThan(0);
    const read = await post({ jsonrpc: '2.0', id: 8, method: 'resources/read',
      params: { uri: resources[0].uri } }, { Accept: 'application/json' });
    expect((await read.json()).result.contents).toBeDefined();
  });

  it('conditioning tools return isError for date arguments', async () => {
    const res = await post({ jsonrpc: '2.0', id: 9, method: 'tools/call',
      params: { name: 'tg.conditioning.walking.get', arguments: { start_date: '2026-01-01' } } },
      { Accept: 'application/json' });
    const result = (await res.json()).result;
    expect(result.isError).toBe(true);
  });
});

describe('rest dataset routes and machine documents', () => {
  const get = (path) => worker.fetch(new Request(`https://mcp.trailgenic.com${path}`), {});

  it('serves every registered dataset route from the bundle', async () => {
    const index = await (await get('/datasets/index')).json();
    expect(index).toBeDefined();
    for (const path of ['/datasets/hiking', '/datasets/hiking/world-model', '/datasets/nutrition',
      '/datasets/conditioning/walking', '/datasets/physiology-adaptation/hr-drift-adaptation-vs-fitness',
      '/datasets/longevity/foundation']) {
      const res = await get(path);
      expect(res.status, `route ${path}`).toBe(200);
      expect((res.headers.get('Content-Type') || '')).toContain('json');
    }
  });

  it('serves capabilities, registry, plugin, openapi, and health', async () => {
    for (const path of ['/capabilities.json', '/.well-known/tool-registry.json',
      '/.well-known/ai-plugin.json', '/.well-known/openapi.json']) {
      expect((await get(path)).status, `route ${path}`).toBe(200);
    }
    const health = await (await get('/health')).json();
    expect(health.uptime).toBeNull();
  });
});
