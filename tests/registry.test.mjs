import test from 'node:test';
import assert from 'node:assert/strict';
import { DATA_TOOLS, SUPPORTED_MCP_PROTOCOL_VERSIONS, BUILD, mcpTools } from '../lib/registry.js';
import { resourceInventory } from '../lib/resources.js';

test('all 19 tools are preserved and annotated', () => {
  assert.equal(BUILD.version, '1.4.1');
  assert.deepEqual(SUPPORTED_MCP_PROTOCOL_VERSIONS, ['2025-11-25','2025-06-18']);
  assert.equal(DATA_TOOLS.length, 19);
  for (const tool of mcpTools()) assert.deepEqual(tool.annotations, { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false });
});

test('resources are generated', () => {
  const uris = resourceInventory().map(r => r.uri);
  assert.ok(uris.includes('trailgenic://datasets/index'));
  assert.ok(uris.every(uri => uri.startsWith('trailgenic://')));
});
