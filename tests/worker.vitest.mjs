import { describe, it, expect } from 'vitest';
import mcpServerSource from '../lib/mcp-server.js?raw';
import worker from '../tool-registry/worker.js';
import { DATASET_LIST, PHYSIOLOGY_MODULES } from '../lib/datasets.js';
import { DATA_TOOLS, datasetCatalog } from '../lib/registry.js';
import { TOOL_HANDLERS } from '../lib/queries.js';
import { readResource, resourceInventory } from '../lib/resources.js';


const normalizeSchema = (schema) => {
  const clone = structuredClone(schema);
  delete clone.$schema;
  for (const prop of Object.values(clone.properties ?? {})) {
    if (prop.type === 'integer' && prop.maximum === Number.MAX_SAFE_INTEGER) delete prop.maximum;
  }
  return clone;
};

const deepSort = (value) => {
  if (Array.isArray(value)) return value.map(deepSort).sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => [k, deepSort(v)]));
  }
  return value;
};

const toolArgs = {
  'tg.datasets.index.get': {},
  'tg.ontology.get': {},
  'tg.protocols.get': {},
  'tg.physiology.adaptation.get': {},
  'tg.hiking.worldModel.get': {},
  'tg.physiology.hrDriftAdaptation.get': {},
  'tg.nutrition.get': { limit: 1 },
  'tg.hydration.get': { limit: 1 },
  'tg.permits.dataset.get': {},
  'tg.terrain.accessibleTrails.get': { limit: 1 },
  'tg.terrain.protocolMatchedHikes.get': { protocol_level: 3, limit: 1 },
  'tg.evidence.validationSummits.get': { limit: 1 },
  'tg.gear.intel.get': { limit: 1 },
  'tg.gear.getIntel': {},
  'tg.longevity.protocol.get': {},
  'tg.longevity.foundationSessions.get': {},
  'tg.conditioning.walking.get': {},
  'tg.conditioning.rucking.get': {},
  'tg.conditioning.running.get': {},
  'tg.longevity.bioAge.compute': { age: 53, resting_hr: 59, distance_mi: 10.94, elevation_gain_ft: 4140, moving_time_min: 256, avg_hr: 122 }
};

describe('worker http behavior', () => {
  it('serves root discovery', async () => {
    const res = await worker.fetch(new Request('https://mcp.trailgenic.com/'), {});
    expect(res.status).toBe(200);
    expect((await res.json()).tools.sort()).toEqual(DATA_TOOLS.map((tool) => tool.id).sort());
  });
  it('serves the TrailGenic Protocols WebMCP browser bundle', async () => {
    const res = await worker.fetch(new Request('https://mcp.trailgenic.com/webmcp-protocols.js'), {});
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toContain('application/javascript');
    expect(res.headers.get('Cache-Control')).toBe('no-cache');
    const source = await res.text();
    expect(source).toContain('get_trailgenic_protocol');
    expect(source).toContain('compare_trailgenic_modalities');
    expect(source).toContain('document.modelContext.registerTool');
  });
  it('keeps GET and OPTIONS /mcp contract', async () => {
    const get = await worker.fetch(new Request('https://mcp.trailgenic.com/mcp'), {});
    expect(get.status).toBe(405);
    expect(get.headers.get('Allow')).toBe('POST');
    const opt = await worker.fetch(new Request('https://mcp.trailgenic.com/mcp', { method: 'OPTIONS' }), {});
    expect(opt.status).toBe(204);
  });
  it('enforces origin-specific CORS on MCP preflight and early errors', async () => {
    const allowed = 'https://trailgenic.com';
    const disallowed = await worker.fetch(new Request('https://mcp.trailgenic.com/mcp', { method: 'OPTIONS', headers: { Origin: 'https://evil.example' } }), {});
    expect(disallowed.status).toBe(403);
    const opt = await worker.fetch(new Request('https://mcp.trailgenic.com/mcp', { method: 'OPTIONS', headers: { Origin: allowed } }), {});
    expect(opt.status).toBe(204);
    expect(opt.headers.get('Access-Control-Allow-Origin')).toBe(allowed);
    expect(opt.headers.get('Vary')).toContain('Origin');
    const body = JSON.stringify({ jsonrpc: '2.0', id: 99, method: 'ping' });
    for (const headers of [{ 'Content-Type': 'text/plain', Accept: 'application/json' }, { 'Content-Type': 'application/json', Accept: 'text/event-stream' }]) {
      const res = await worker.fetch(new Request('https://mcp.trailgenic.com/mcp', { method: 'POST', body, headers: { Origin: allowed, ...headers } }), {});
      expect([415, 406]).toContain(res.status);
      expect(res.headers.get('Access-Control-Allow-Origin')).toBe(allowed);
      expect(res.headers.get('Vary')).toContain('Origin');
    }
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

  it('lists semantically equivalent schemas for every registry tool', async () => {
    const list = await post({ jsonrpc: '2.0', id: 50, method: 'tools/list', params: {} }, { Accept: 'application/json' });
    const tools = (await list.json()).result.tools;
    expect(tools.map((tool) => tool.name).sort()).toEqual(DATA_TOOLS.map((tool) => tool.id).sort());
    const byName = new Map(tools.map((tool) => [tool.name, tool]));
    for (const tool of DATA_TOOLS) {
      expect(deepSort(normalizeSchema(byName.get(tool.id).inputSchema))).toEqual(deepSort(tool.inputSchema));
    }
  });

  it('successfully calls every registered tool and rejects invalid arguments before handlers', async () => {
    expect(Object.keys(toolArgs).sort()).toEqual(DATA_TOOLS.map((tool) => tool.id).sort());
    for (const tool of DATA_TOOLS) {
      const call = await post({ jsonrpc: '2.0', id: 60, method: 'tools/call', params: { name: tool.id, arguments: toolArgs[tool.id] } }, { Accept: 'application/json' });
      const result = (await call.json()).result;
      expect(result?.isError, tool.id).not.toBe(true);
      expect(result?.structuredContent, tool.id).toBeDefined();
    }
  });

  it('rejects extra properties with a corrective Zod validation result', async () => {
    const extra = await post({ jsonrpc: '2.0', id: 61, method: 'tools/call', params: { name: 'tg.datasets.index.get', arguments: { unknown: true } } }, { Accept: 'application/json' });
    const result = (await extra.json()).result;
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toMatch(/unknown|tg\.datasets\.index\.get/i);
  });

  it('rejects missing required arguments with a corrective Zod validation result', async () => {
    const missing = await post({ jsonrpc: '2.0', id: 62, method: 'tools/call', params: { name: 'tg.longevity.bioAge.compute', arguments: {} } }, { Accept: 'application/json' });
    const result = (await missing.json()).result;
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('age');
  });

  it('rejects out-of-range numerics with a corrective Zod validation result', async () => {
    const outOfRange = await post({ jsonrpc: '2.0', id: 63, method: 'tools/call', params: { name: 'tg.longevity.bioAge.compute', arguments: { ...toolArgs['tg.longevity.bioAge.compute'], age: 101 } } }, { Accept: 'application/json' });
    const result = (await outOfRange.json()).result;
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('age');
  });


  it('rejects invalid enum values with a meaningful schema validation result', async () => {
    const invalidEnum = await post({ jsonrpc: '2.0', id: 65, method: 'tools/call', params: { name: 'tg.physiology.adaptation.get', arguments: { module: 'not-a-module' } } }, { Accept: 'application/json' });
    expect(invalidEnum.status).toBe(200);
    const result = (await invalidEnum.json()).result;
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toMatch(/module|tg\.physiology\.adaptation\.get/i);
  });

  it('invalid gear category returns corrective isError', async () => {
    const res = await post({ jsonrpc: '2.0', id: 64, method: 'tools/call', params: { name: 'tg.gear.getIntel', arguments: { category: 'Invalid' } } }, { Accept: 'application/json' });
    const result = (await res.json()).result;
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('expected one of');
  });

  it('lists every registry tool and calls one end to end', async () => {
    const list = await post({ jsonrpc: '2.0', id: 5, method: 'tools/list', params: {} }, { Accept: 'application/json' });
    const tools = (await list.json()).result.tools;
    expect(tools.map((tool) => tool.name).sort()).toEqual(DATA_TOOLS.map((tool) => tool.id).sort());
    const call = await post({ jsonrpc: '2.0', id: 6, method: 'tools/call',
      params: { name: 'tg.datasets.index.get', arguments: {} } }, { Accept: 'application/json' });
    const result = (await call.json()).result;
    expect(result.structuredContent).toBeDefined();
    expect(result.isError).not.toBe(true);
  });

  it('serves every registry resource through the SDK with full REST parity', async () => {
    const list = await post({ jsonrpc: '2.0', id: 7, method: 'resources/list', params: {} }, { Accept: 'application/json' });
    const resources = (await list.json()).result.resources;
    expect(resources.map((resource) => resource.uri).sort()).toEqual(resourceInventory().map((resource) => resource.uri).sort());
    const routesByUri = new Map([['trailgenic://datasets/index', '/datasets/index']]);
    for (const dataset of DATASET_LIST.filter((entry) => entry.enabled)) routesByUri.set(`trailgenic://datasets/${dataset.id}`, dataset.endpoint);
    for (const module of PHYSIOLOGY_MODULES) routesByUri.set(`trailgenic://physiology/${module.slug}`, `/datasets/physiology-adaptation/${module.slug}`);
    for (const resource of resourceInventory()) {
      const read = await post({ jsonrpc: '2.0', id: 80, method: 'resources/read', params: { uri: resource.uri } }, { Accept: 'application/json' });
      const parsed = JSON.parse((await read.json()).result.contents[0].text);
      const route = routesByUri.get(resource.uri);
      expect(route, resource.uri).toBeDefined();
      const rest = await (await worker.fetch(new Request(`https://mcp.trailgenic.com${route}`), {})).json();
      expect(parsed, resource.uri).toEqual(rest);
    }
  });

  it('conditioning tools return isError for date arguments', async () => {
    const res = await post({ jsonrpc: '2.0', id: 9, method: 'tools/call',
      params: { name: 'tg.conditioning.walking.get', arguments: { start_date: '2026-01-01' } } },
      { Accept: 'application/json' });
    const result = (await res.json()).result;
    expect(result.isError).toBe(true);
  });
});


  it('does not import Ajv or override SDK-private validation in Worker runtime code', async () => {
    expect(mcpServerSource).not.toMatch(/from ["']ajv["']/i);
    expect(mcpServerSource).not.toContain('new Ajv');
    expect(mcpServerSource).not.toMatch(/server\.[A-Za-z_$][\w$]*\s*=/);
    expect(mcpServerSource).not.toMatch(/\._[A-Za-z_$][\w$]*\s*=/);
  });

describe('rest dataset routes and machine documents', () => {
  const get = (path) => worker.fetch(new Request(`https://mcp.trailgenic.com${path}`), {});

  it('serves every registered dataset route from the bundle', async () => {
    const index = await (await get('/datasets/index')).json();
    expect(index).toBeDefined();
    for (const path of ['/datasets/hiking', '/datasets/hiking/world-model', '/datasets/nutrition',
      '/datasets/terrain-intelligence/protocol-matched-hikes-v2',
      '/datasets/conditioning/walking', '/datasets/physiology-adaptation/hr-drift-adaptation-vs-fitness',
      '/datasets/longevity/foundation']) {
      const res = await get(path);
      expect(res.status, `route ${path}`).toBe(200);
      expect((res.headers.get('Content-Type') || '')).toContain('json');
    }
  });

  it('filters the protocol-matched hike library without implying universal clearance', async () => {
    const filtered = TOOL_HANDLERS.get('tg.terrain.protocolMatchedHikes.get')({ protocol_level: 3 });
    expect(filtered.hikes.length).toBeGreaterThan(0);
    expect(filtered.hikes.every((hike) => hike.protocol_level === 3)).toBe(true);
    const full = await (await get('/datasets/terrain-intelligence/protocol-matched-hikes-v2')).json();
    expect(full.numberOfItems).toBe(22);
    expect(full.not_a_clearance).toBe(true);
  });

  it('serves capabilities, registry, plugin, openapi, and health', async () => {
    for (const path of ['/capabilities.json', '/.well-known/tool-registry.json',
      '/.well-known/ai-plugin.json', '/.well-known/openapi.json']) {
      expect((await get(path)).status, `route ${path}`).toBe(200);
    }
    const health = await (await get('/health')).json();
    expect(health.uptime).toBeNull();
    expect(health.status).toBe('ready');
    expect(health.capabilities_status).toBe('ready');
    expect(health.infrastructure.agent_ready).toBe(true);
    expect(health.checks.tool_count).toBe(DATA_TOOLS.length);
  });

  it('serves one reconciled canonical movement spine', async () => {
    const hiking = await (await get('/datasets/hiking')).json();
    expect(hiking.dataset_id).toBe('tg_hikeworldmodel_v3_1');
    expect(hiking.summary_statistics.hiking_sessions).toBe(36);
    expect(hiking.movement_architecture).toEqual(expect.objectContaining({
      total_public_structured_sessions: 87,
      walking_sessions: 22,
      rucking_sessions: 14,
      running_sessions: 15,
      hiking_sessions: 36
    }));
    expect(hiking.withdrawn_interpretations).toContainEqual(expect.objectContaining({
      claim_id: 'tg_fatigue_reveal_effort',
      status: 'withdrawn'
    }));

    const walking = await (await get('/datasets/conditioning/walking')).json();
    const rucking = await (await get('/datasets/conditioning/rucking')).json();
    const running = await (await get('/datasets/conditioning/running')).json();
    expect(walking.existence_metadata.session_count).toBe(22);
    expect(rucking.existence_metadata.session_count).toBe(14);
    expect(running.existence_metadata.session_count).toBe(15);
    expect(running.analytic_tracks.max_speed_intervals.sessions).toEqual([15]);
  });

  it('excludes empty longevity shells and exposes claim qualification', async () => {
    const index = await (await get('/datasets/index')).json();
    const ids = index.datasets.map((dataset) => dataset.dataset_id);
    expect(ids).not.toContain('tg_longevity_registry_v1');
    expect(ids).not.toContain('tg_longevity_validation_v1');

    const ontology = await (await get('/datasets/ontology')).json();
    const fatigue = ontology.entities.find((entity) => entity.entity_id === 'tg_fatigue_reveal_effort');
    const economy = ontology.entities.find((entity) => entity.entity_id === 'tg_longitudinal_hiking_economy');
    expect(fatigue.status).toBe('withdrawn');
    expect(economy.status).toBe('active');

    const protocols = await (await get('/datasets/protocols')).json();
    const serialized = JSON.stringify(protocols);
    expect(serialized).not.toMatch(/permanent_mitochondrial|permanent_metabolic|full physiological autonomy/i);
    expect(protocols.governor.evidence_boundary).toMatch(/not a validated physiological subsystem/i);
  });
});


describe('document cache-control contracts', () => {
  const get = (path) => worker.fetch(new Request(`https://mcp.trailgenic.com${path}`), {});
  it('serves generated machine documents with no-cache and preserves dataset caching', async () => {
    for (const path of ['/', '/capabilities.json', '/.well-known/tool-registry.json', '/.well-known/ai-plugin.json', '/.well-known/openapi.json', '/health']) {
      const res = await get(path);
      expect(res.headers.get('Cache-Control'), path).toBe('no-cache');
    }
    const dataset = await get('/datasets/hiking');
    expect(dataset.headers.get('Cache-Control')).toBe('public, max-age=3600');
  });

  it('dataset index resource exactly equals canonical catalog', () => {
    expect(readResource('trailgenic://datasets/index')).toEqual(datasetCatalog());
  });

  it('handler and tool registries have reverse parity', () => {
    expect([...TOOL_HANDLERS.keys()].sort()).toEqual(DATA_TOOLS.map((tool) => tool.id).sort());
  });
});
