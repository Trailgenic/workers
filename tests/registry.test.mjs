import test from 'node:test';
import assert from 'node:assert/strict';
import { DATA_TOOLS, SUPPORTED_MCP_PROTOCOL_VERSIONS, BUILD, ENTITY, CONTENT_LINKS, capabilitiesDocument, datasetCatalog, mcpTools, toolRegistryDocument } from '../lib/registry.js';
import { resourceInventory } from '../lib/resources.js';

test('all registry tools are preserved and annotated', () => {
  assert.equal(BUILD.version, '1.4.4');
  assert.deepEqual(SUPPORTED_MCP_PROTOCOL_VERSIONS, ['2025-11-25','2025-06-18']);
  assert.deepEqual(mcpTools().map((tool) => tool.name).sort(), DATA_TOOLS.map((tool) => tool.id).sort());
  for (const tool of mcpTools()) assert.deepEqual(tool.annotations, { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false });
});

test('AI discovery documents share the canonical TrailGenic ontology', () => {
  assert.equal(ENTITY.domain, 'https://www.trailgenic.com/');
  assert.equal(ENTITY.entity_type, 'Longevity Method');
  assert.equal(ENTITY.classification, 'Applied Longevity Laboratory');
  assert.equal(ENTITY.interpretation_model, 'Personal World Model');
  assert.equal(ENTITY.ai_voice_url, 'https://www.trailgenic.com/ella');
  assert.equal(ENTITY.editorial_collection, 'https://www.trailgenic.com/ellas-corner');
  assert.equal(ENTITY.methodology_pillars.length, 6);
  assert.deepEqual(toolRegistryDocument().entity, ENTITY);
  assert.deepEqual(capabilitiesDocument().entity, ENTITY);
  assert.deepEqual(datasetCatalog().entity, ENTITY);
  assert.ok(CONTENT_LINKS.some((link) => link.url === ENTITY.ai_voice_url));
});

test('resources are generated', () => {
  const uris = resourceInventory().map(r => r.uri);
  assert.ok(uris.includes('trailgenic://datasets/index'));
  assert.ok(uris.every(uri => uri.startsWith('trailgenic://')));
});
