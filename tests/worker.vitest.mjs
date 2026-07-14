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
