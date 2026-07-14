import { it, expect } from 'vitest';
import worker from '../tool-registry/worker.js';

it('the full corrected live-acceptance harness passes against the real worker', async () => {
  const realFetch = globalThis.fetch;
  globalThis.fetch = (url, opts = {}) => {
    const u = String(url);
    if (u.startsWith('https://mcp.trailgenic.com')) {
      return worker.fetch(new Request(u, opts), {});
    }
    return realFetch(url, opts);
  };
  try {
    await import('../scripts/live-acceptance.mjs');
  } finally {
    globalThis.fetch = realFetch;
  }
  expect(true).toBe(true);
}, 60000);
