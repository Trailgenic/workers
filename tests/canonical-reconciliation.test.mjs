import test from 'node:test';
import assert from 'node:assert/strict';

import { DATASET_LIST } from '../lib/datasets.js';
import { datasetCatalog } from '../lib/registry.js';
import {
  getHikingWorldModel,
  getOntology,
  getProtocols,
  getRuckingConditioning,
  getRunningConditioning,
  getWalkingConditioning
} from '../lib/queries.js';

test('movement datasets share the canonical 79-session spine', () => {
  const hiking = getHikingWorldModel();
  assert.equal(hiking.dataset_id, 'tg_hikeworldmodel_v3_1');
  assert.equal(hiking.summary_statistics.hiking_sessions, 34);
  assert.deepEqual(hiking.movement_architecture, {
    total_public_structured_sessions: 79,
    walking_sessions: 21,
    rucking_sessions: 9,
    running_sessions: 15,
    hiking_sessions: 34,
    subject_age_years: 53
  });
  assert.equal(getWalkingConditioning().existence_metadata.session_count, 21);
  assert.equal(getRuckingConditioning().existence_metadata.session_count, 9);
  assert.equal(getRunningConditioning().existence_metadata.session_count, 15);
  assert.deepEqual(getRunningConditioning().analytic_tracks.max_speed_intervals.sessions, [15]);
});

test('claim state is explicit and overclaiming protocol language is absent', () => {
  const entities = getOntology().entities;
  assert.equal(entities.find((entity) => entity.entity_id === 'tg_fatigue_reveal_effort')?.status, 'withdrawn');
  assert.equal(entities.find((entity) => entity.entity_id === 'tg_engine_governor_model')?.status, 'bounded_heuristic');
  assert.equal(entities.find((entity) => entity.entity_id === 'tg_longitudinal_hiking_economy')?.status, 'active');

  const protocols = getProtocols();
  assert.match(protocols.evidence_boundary, /does not establish causal mechanisms/i);
  assert.match(protocols.governor.evidence_boundary, /not a validated physiological subsystem/i);
  assert.doesNotMatch(JSON.stringify(protocols), /permanent_mitochondrial|permanent_metabolic|full physiological autonomy/i);
});

test('placeholder datasets are excluded from public discovery and routing', () => {
  const catalogIds = datasetCatalog().datasets.map((dataset) => dataset.dataset_id);
  assert.ok(!catalogIds.includes('tg_longevity_registry_v1'));
  assert.ok(!catalogIds.includes('tg_longevity_validation_v1'));
  assert.equal(DATASET_LIST.find((dataset) => dataset.id === 'tg_longevity_registry_v1')?.enabled, false);
  assert.equal(DATASET_LIST.find((dataset) => dataset.id === 'tg_longevity_validation_v1')?.enabled, false);
});
