# TrailGenic Foundation Comparability — Release 2026-09-24.2

## Scope and evidence policy
**Version 0.1.0 / pilot.** This is a public *selected-observation* evidence object and deterministic comparison-screening rule, not a medical readiness model, randomized experiment, or full-ledger update.

## Release reconciliation (preserve both)
- September 17, 2026 MCP datasets remain unchanged and reproducible: Walking 25, Rucking 18, Running 20, Hiking 40 (103 total).
- September 24, 2026 Webflow Foundation evidence release `2026-09-24.2`: Walking 26, Rucking 19, Running 21, Hiking 41 (107 total).
- Only Walking S26, Rucking S19, and Running S21 are added to the new API as already-public selected snapshots, not the other private rows.
- Different dataset versions and snapshots must never be silently coalesced.

## Original rule / reproducible interpretation
Invoke `tg.longevity.foundationComparability.get` optionally with a public metric; GET `/datasets/longevity/foundation/comparability` to retrieve the default full result. The same object is an MCP resource under `trailgenic://datasets/tg_foundation_comparability_2026_09_24`.

1. Feeding-state screen: separate Walking S26 (fed) from the fasted-control reference.
2. Distance screen: Rucking S19 (3.86 mi) is beyond the pilot 3.15–3.25 mi flat-route band around the approximately 3.2 mi Foundation reference. The band is a heuristic, **not validated experimental equivalence**.
3. Protocol screen: Running S21 uses a mixed run–walk protocol, not the steady-running reference S10–S14.

These latest sessions cannot be interpreted as a matched three-way experiment. Even if the pilot screens passed, confounders (date, training history, intensity, sleep, hydration) would remain. One-person observations cannot isolate causal adaptation mechanisms or establish clinical recovery readiness.

## Provenance and privacy
- Source: September 24 master as represented by the public [TrailGenic Foundation page](https://www.trailgenic.com/foundation-comparison), release 2026-09-24.2, verified October 8, 2026.
- Recorder: Mike Ye. Interpretation: Ella (AI).
- Corrected HR drift and Zone 1 share are fractions in the public page JSON (0.04 → 4.0%); the API stores percent values explicitly.
- No private master workbook, full ledger, raw telemetry, private route location, or credentials are distributed.

## Acceptance criteria and rollout
- Historical September 17 endpoints and 103-record aggregates stay unchanged.
- New tool appears in tool catalog, resources, OpenAPI and root discovery through the existing registry.
- REST default matches MCP default byte-for-byte after JSON parsing; seven optional projections are schema-limited.
- Tests verify the three exceptions, exact source metrics, release lineage, and worker REST route.
- Do not declare AI discovery improved without an independent external agent retrieval/citation test.
- **Publishing is separate:** the Foundation Webflow HTML Embed is staged in Designer, not live. Merging this repository's main branch triggers automatic deployment jobs for multiple workers (including permit and Sleepgenic); coordinate that separately and get explicit Webflow publish authorization.
