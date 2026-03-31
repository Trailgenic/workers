# Claude Handoff: `trailgenic/workers` Repository Summary

## 1) Overall repository purpose
This repository hosts Cloudflare Worker code for TrailGenic's MCP/web discovery surface plus machine-readable dataset payloads served through those workers.

## 2) Top-level structure
- `README.md` — high-level description of MCP registry/discovery endpoints and dataset endpoint catalog.
- `lib/` — shared JavaScript modules used by workers.
- `tool-registry/` — primary Cloudflare Worker that serves discovery/registry/capabilities/openapi/health and dataset routes.
- `workers/root-discovery/` — secondary Cloudflare Worker that serves a root-domain pointer for `/.well-known/tool-registry.json`.
- `datasets/` — versioned JSON datasets consumed/served by workers.
- `datasets/evidence_validation/` — validation hike dataset(s).
- `datasets/hydration/` — hydration/electrolyte dataset(s).
- `datasets/nutrition/` — canonical nutrition dataset and explicit schema.
- `datasets/ontology/` — ontology/lexicon dataset.
- `datasets/physiology_adaptation/` — physiology adaptation shell modules + active HR drift module.
- `datasets/protocol_outcomes/` — protocol outcomes placeholder dataset.
- `datasets/protocols/` — protocol kernel dataset.
- `datasets/terrain_intelligence/` — JSON-LD terrain intelligence dataset.

## 3) File-by-file inventory (non-`.git` files)
- `README.md` — repo documentation with public endpoint URLs.
- `lib/datasets.js` — canonical dataset registry (`DATASETS`, `DATASET_LIST`) mapping route → source JSON.
- `tool-registry/worker.js` — main Worker request router and JSON response generator.
- `tool-registry/wrangler.jsonc` — Wrangler config for the primary worker (`trailgenic-tool-registry`).
- `workers/root-discovery/worker.js` — minimal worker serving a registry pointer on `/.well-known/tool-registry.json` and otherwise proxying through.
- `workers/root-discovery/wrangler.jsonc` — Wrangler config for root discovery worker + route binding for `trailgenic.com/.well-known/*`.
- `datasets/electrolytes_v1.json` — legacy/flat top-level electrolyte product array.
- `datasets/nutrition_v1.json` — legacy/flat top-level nutrition/electrolyte-style product array.
- `datasets/evidence_validation/tg_validation_summits_v1.json` — structured validation hikes dataset (records include trail metadata, protocol mapping, outcomes).
- `datasets/hydration/tg_electrolytes_dataset_v1.json` — canonical hydration electrolyte product array currently served at `/datasets/hydration`.
- `datasets/nutrition/tg_nutrition_dataset_v1.json` — canonical nutrition dataset envelope with metadata + `records`.
- `datasets/nutrition/tg_nutrition_schema_v1.json` — machine-readable field schema for nutrition dataset.
- `datasets/ontology/tg_ontology_v1.json` — ontology/lexicon entities for TrailGenic concepts.
- `datasets/physiology_adaptation/tg_physiology_adaptation_v1.json` — family shell dataset for physiology adaptation.
- `datasets/physiology_adaptation/hr_drift_adaptation_v1.json` — active HR drift adaptation module with sources/related URLs.
- `datasets/physiology_adaptation/hr_drift_adaptation_vs_fitness_v1.json` — shell module for HR drift vs fitness.
- `datasets/physiology_adaptation/seven_day_aftereffect_v1.json` — shell module for seven-day aftereffect adaptation.
- `datasets/physiology_adaptation/fasted_autophagy_v1.json` — shell module for fasted autophagy adaptation.
- `datasets/physiology_adaptation/altitude_adaptation_v1.json` — shell module for altitude adaptation.
- `datasets/physiology_adaptation/altitude_breathing_acclimatization_v1.json` — shell module for breathing acclimatization at altitude.
- `datasets/physiology_adaptation/electrolytes_physiological_stability_v1.json` — shell module for electrolyte stability adaptation.
- `datasets/physiology_adaptation/cold_exposure_recovery_altitude_v1.json` — shell module for cold exposure recovery in altitude contexts.
- `datasets/physiology_adaptation/deep_cold_protocols_v1.json` — shell module for deep cold protocols.
- `datasets/physiology_adaptation/heat_training_thermoregulation_v1.json` — shell module for heat training thermoregulation.
- `datasets/physiology_adaptation/altitude_terrain_physiology_comparison_v1.json` — shell module for terrain/altitude physiology comparison.
- `datasets/physiology_adaptation/aerobic_training_effect_zero_anaerobic_load_v1.json` — shell module for mostly-aerobic adaptation effects.
- `datasets/physiology_adaptation/eccentric_load_stress_inversion_v1.json` — shell module for eccentric-load stress adaptation.
- `datasets/physiology_adaptation/sleep_science_endurance_v1.json` — shell module for sleep/endurance adaptation.
- `datasets/physiology_adaptation/overextension_fasted_hiking_v1.json` — shell module for fasted overextension risk/safety adaptation.
- `datasets/physiology_adaptation/metabolic_flexibility_adaptation_v1.json` — shell module for metabolic flexibility adaptation.
- `datasets/protocol_outcomes/tg_protocol_outcomes_v1.json` — placeholder for protocol outcome signals.
- `datasets/protocols/tg_protocol_kernel_v1.json` — protocol progression kernel (Foundation → Activation → Adaptation → Consolidation → TrailGenic).
- `datasets/terrain_intelligence/tg_accessible_trails_top100_v1.json` — schema.org JSON-LD dataset of top 100 accessible trails.

## 4) Existing worker endpoints

### A) `tool-registry` worker (`tool-registry/worker.js`)
Primary deployment that serves both MCP discovery and datasets.

- `GET /` — discovery object with links to registry/plugin/openapi/capabilities/datasets/health.
- `GET /.well-known/tool-registry.json` — MCP tool registry JSON.
- `GET /.well-known/ai-plugin.json` — AI plugin manifest.
- `GET /.well-known/openapi.json` — OpenAPI JSON exposing page/dataset endpoints.
- `GET /capabilities.json` — capability index with tools + dataset links.
- `GET /health` — operational health payload.
- `GET /datasets/index` — machine-readable catalog derived from `DATASET_LIST`.
- `GET /datasets/nutrition/schema` — nutrition schema JSON.
- `GET <dataset endpoint from DATASET_LIST>` — generic dataset route serving raw GitHub JSON by `source_path`.
- `GET /datasets/hydration` — explicit hydration route (redundant with generic list routing).
- `GET /datasets/physiology-adaptation/<module-slug>` — physiology module routing map to files in `datasets/physiology_adaptation/`.
- Fallback returns `404 Not Found`.

Special behavior:
- For hostname `trailgenic.com` or `www.trailgenic.com` with path `/.well-known/tool-registry.json`, returns pointer endpoint to `mcp.trailgenic.com`.
- Dataset payloads are fetched from GitHub raw URLs and returned with CORS + cache headers.

### B) `root-discovery` worker (`workers/root-discovery/worker.js`)
- `GET /.well-known/tool-registry.json` — returns pointer (`WebMCP`) to `https://mcp.trailgenic.com/.well-known/tool-registry.json`.
- Any other path delegates with `return fetch(request)`.

## 5) Cloudflare configuration (`wrangler.jsonc` files)

### `tool-registry/wrangler.jsonc`
- `name`: `trailgenic-tool-registry`
- `main`: `worker.js`
- `compatibility_date`: `2026-02-18`
- No explicit `routes`, `kv_namespaces`, `d1_databases`, `r2_buckets`, `durable_objects`, `queues`, `services`, `vars`, or `triggers` configured in this file.

### `workers/root-discovery/wrangler.jsonc`
- `name`: `trailgenic-root-discovery`
- `main`: `worker.js`
- `compatibility_date`: `2026-02-18`
- Route binding:
  - pattern: `trailgenic.com/.well-known/*`
  - zone: `trailgenic.com`
- No KV/D1/R2/DO/queue/cron bindings declared.

## 6) Existing data schemas / JSON-LD structures
- **Dataset registry schema**: `lib/datasets.js` defines canonical metadata fields used for serving/indexing (`id`, `endpoint`, `source_path`, optional `schema_source_path`, `version`, `family`, `description`, `enabled`, optional `aliases`).
- **Nutrition schema**: `datasets/nutrition/tg_nutrition_schema_v1.json` explicitly declares field-level schema entries (`name`, `type`, `required`, `description`, optional `allowed_values`) for nutrition records.
- **JSON-LD present**: `datasets/terrain_intelligence/tg_accessible_trails_top100_v1.json` uses `@context: https://schema.org` and `@type: Dataset` with nested `CreativeWork` entries.
- **Physiology modules pattern**: physiology files use a common envelope (`dataset_id`, `dataset_family`, `title`, `version`, `status`, `last_updated`, `description`, `modules`, `records`).
- **Nutrition/hydration record patterns**: hydration top-level array of product objects; canonical nutrition uses metadata + record list.

## 7) Dependencies / package manifest
- There is currently **no `package.json`** at repository root and no Node dependency manifest checked in.
- Worker code is plain JavaScript modules compatible with Cloudflare Worker runtime.

## 8) Environment variables / secrets referenced
- No environment variable names or secret bindings are referenced in the codebase (`env`, `process.env`, KV/D1 binding accessors not present).
- No secret placeholders (e.g., API keys) were found in worker or wrangler files.

## 9) Deployment patterns already established
1. **Multi-worker split by concern**
   - Root-domain `/.well-known/*` pointer worker (`root-discovery`) and main MCP/data worker (`tool-registry`).
2. **Static JSON response model**
   - Discovery artifacts are generated inline in worker code.
3. **Dataset-as-files pattern**
   - Canonical datasets live in-repo as JSON; runtime serves them by fetching GitHub raw URLs.
4. **Registry-driven dataset routing**
   - `lib/datasets.js` centralizes dataset metadata and enables `DATASET_LIST`-driven route generation and index emission.
5. **Cache + CORS defaults**
   - Most JSON responses use `Access-Control-Allow-Origin: *` and `Cache-Control: public, max-age=3600`.
6. **No stateful Cloudflare products currently used**
   - No KV, D1, R2, Durable Objects, Queues, or cron triggers declared.

## 10) Practical implications for the planned permit-intelligence feature
To match existing repo patterns, a new feature should likely:
- Add new dataset JSON files under `datasets/<new_family>/...`.
- Register canonical endpoints in `lib/datasets.js`.
- Expose dataset through existing `DATASET_LIST`-driven routing (or add explicit route blocks when necessary).
- Keep response headers/caching consistent.
- If introducing polling + SMS, note this will be a **new pattern** because current repo has no cron triggers, queues, or secret-bound API integrations yet.
