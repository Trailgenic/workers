import test from 'node:test';
import assert from 'node:assert/strict';

import { DATASET_LIST } from '../lib/datasets.js';
import { datasetCatalog } from '../lib/registry.js';
import {
  getHikingWorldModel,
  getLongevityFoundationSessions,
  getOntology,
  getProtocols,
  getRuckingConditioning,
  getRunningConditioning,
  getWalkingConditioning
} from '../lib/queries.js';

test('movement datasets share the canonical 103-session spine', () => {
  const hiking = getHikingWorldModel();
  assert.equal(hiking.dataset_id, 'tg_hikeworldmodel_v3_1');
  assert.equal(hiking.summary_statistics.hiking_sessions, 40);
  assert.deepEqual(hiking.movement_architecture, {
    total_public_structured_sessions: 103,
    walking_sessions: 25,
    rucking_sessions: 18,
    running_sessions: 20,
    hiking_sessions: 40,
    subject_age_years: 53
  });
  assert.equal(getWalkingConditioning().existence_metadata.session_count, 25);
  assert.equal(getRuckingConditioning().existence_metadata.session_count, 18);
  assert.equal(getRunningConditioning().existence_metadata.session_count, 20);
  assert.deepEqual(getRunningConditioning().analytic_tracks.max_speed_intervals.sessions, [15, 16, 17]);

  const foundation = getLongevityFoundationSessions();
  assert.equal(foundation.status, 'compatibility_record');
  assert.equal(foundation.phase_summary.total_sessions, 25);
  assert.equal(foundation.privacy_scope.data_granularity, 'aggregate_plus_selected_sessions');
  assert.equal(foundation.sessions, undefined);
});

test('corrected conditioning HR-drift series are canonical', () => {
  assert.deepEqual(
    getWalkingConditioning().records[0].summary_statistics.corrected_hr_drift_percent.values_by_session,
    [-3, 2, -1.5, 3, 3.5, 2.5, 2, 4, 2, 2.5, 0.5, 2, 2.5, 1.5, -1.5, -0.5, 3.5, 2.5, 5.5, 2, 6.5, 4, 3, 2.5, 2.5]
  );
  assert.deepEqual(
    getRuckingConditioning().records[0].summary_statistics.corrected_hr_drift_percent.values_by_session,
    [3, 1, 0, 1, 2, -2, 0, 1, 2, 3.5, 0.5, 0.5, 4, 1.3, 3, 2, 1.5, 2.5]
  );
  assert.deepEqual(
    getRunningConditioning().records[0].summary_statistics.corrected_hr_drift_percent.values_by_session,
    [5.5, 1, 4.5, 3.3, 0.5, 2.7, 2.5, 6.8, -1, -1.5, 1, 3.2, 4, -3, 2, -1.5, -2.5, 4.5, 5, -2]
  );
  assert.equal(getRunningConditioning().selected_sessions[0].hr_drift_pct, 2);
});

test('Hike 35 is explicitly bounded heat training', () => {
  const hike35 = getHikingWorldModel().selected_sessions.find((entry) => entry.hike === 35);
  assert.equal(hike35.protocol_context, 'deliberate_heat_training');
  assert.equal(hike35.route_aware_hr_drift_pct, -0.4);
  assert.match(hike35.interpretation, /not heat acclimation/i);
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

test('September release preserves source uncertainty and missing recovery', () => {
  const walking = getWalkingConditioning();
  assert.equal(walking.selected_sessions.find(s => s.session === 25).quality_status, 'corrected_from_user_source');
  const s25 = walking.selected_sessions.find(s => s.session === 25);
  assert.equal(s25.avg_hr_bpm, 115);
  assert.equal(s25.distance_miles, 3.25);
  assert.equal(s25.zone_1_pct, 70);
  assert.equal(s25.zone_2_pct, 30);
  assert.equal(walking.records[0].summary_statistics.average_hr_bpm_mean, 106.28);
  assert.equal(walking.data_quality_notes[0].status, 'resolved');
  const running = getRunningConditioning();
  assert.equal(running.selected_sessions.find(s => s.session === 20).hr_drift_pct, -2);
  assert.equal(running.selected_sessions.find(s => s.session === 20).recovery_observation, 'not ready');
  assert.deepEqual(running.analytic_tracks.mixed_run_walk.sessions, [18, 19, 20]);
  const hike40 = getHikingWorldModel().selected_sessions.find(s => s.hike === 40);
  assert.equal(hike40.recovery_status, 'unmeasured');
  assert.equal(hike40.overnight_hrv_ms.post_1, null);
  assert.equal(hike40.overnight_hrv_ms.post_2, null);
  assert.match(getRuckingConditioning().records[0].summary_statistics.recovery_observation, /1 missing/);
});
