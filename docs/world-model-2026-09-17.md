# TrailGenic World Model — September 17, 2026 review

Release 2026-09-17.1. Field record: Mike Ye. Interpretation: Ella. Governing source: TG World Model Datasets Charter v1.0, September 2026.

The September 17 values-only master contains **103 ledger entries: 25 Walking, 18 Rucking, 20 Running and 40 Hiking**. It contains no formulas or Excel error cells. A count of ledger entries is not a count of independently verified experiments. The source workbook remains unchanged.

## Interpretation through the charter

| Layer | Recorded and derived evidence | Interpretation and next decision |
| --- | --- | --- |
| Walking — control | S25: 3.22 mi, 53 min, HR 110 bpm, 97% Z1, drift +2.5%, effort 1, anaerobic effect 0. Its populated fields match S24 except date. | Preserve S25 in the ledger, but do not count it as independent replication before confirmation. Keep the route and effort stable. |
| Rucking — load | Five 20 lb exposures, S14–18, average 112.6 bpm; effort 1 and zero anaerobic effect throughout. S18: 3.25 mi, 58.6 min, HR 112, drift +2.5%. | Repeated in-session tolerance supports holding the load. Timed recovery and symptoms are needed before progression; ready flags alone do not establish absorption. |
| Running — cardiovascular | S20: 3.23 mi in 39.3 min, HR 148/178, drift −2.0%, load 79, aerobic effect 3.1, anaerobic effect 0.9. S19: 3.15 mi in 40.6 min, HR 146/174, load 66. | Pace was approximately 12:10/mi versus 12:53, a 5.6% reduction in time per mile, with higher recorded cardiovascular demand. This is not an efficiency gain established by matched work. Consolidate and collect follow-up before escalating. |
| Hiking — expression | 40 hikes, 430.66 mi, 164,610 ft gain, 13,515.4 elapsed min. H39 HRV: 43 → 34 → 42 ms. H40 HR 124, drift −1.2%, load 54; post-hike recovery missing. | H39 supports return toward baseline in the measured window. H40 supports controlled execution only; its recovery cost remains unknown. Prefer matched routes and complete follow-up. |

Running S15–17 are explicitly declared maximum-effort intervals. S18–20 remain mixed run/walk; intent and individual interval splits are not reconstructed from whole-session values. S20 run/walk time is 17:01/22:13. Its negative whole-session drift cannot establish improved running economy, adaptation, or completed recovery.

The charter's loop remains **Context → Behavior → Physiological Response → Recovery → Adaptation → Decision Rule**. Adaptation is an interpretation to test against comparable returns, not an automatic consequence of completing an effort. These decisions are provisional N=1 practice rules, not validated thresholds.

## Source-quality findings

1. **Walking S25 duplicates S24's populated values except date.** Retained with confirmation pending. Including S25 gives mean HR 106.08 bpm and mean drift 2.14%; excluding it gives 105.92 bpm and 2.13%. Historical S1–12 versus S13–24 comparisons stay explicitly labeled.
2. **Running S20 HR Drift Audit cell contains 48.** Its meaning is unspecified. Excluded from physiological calculations. The actual corrected-drift field is −0.02, represented publicly as −2.0%.
3. **H38 first-night sleep total conflicts with stages.** Deep 68 + REM 40 + light 246 = 354 min, while total is 304. Retain both source values and exclude that night from duration/stage-share comparisons pending correction. Its HRV observation is a separate field, not silently changed.
4. **H40 recovery is unmeasured.** Garmin battery loss left the first and second post-hike nights missing; no favorable or unfavorable outcome is assigned.
5. **Rucking S12 recovery flag is missing.** There are 17 ready labels, not 18. Running S17–20 carry not-ready labels, but flag timing and derivation are unspecified. Labels alone do not prove recovery debt.
6. **Historical inferred scores remain historical.** Autophagy was not measured. Legacy Stability Index and latent scores are not promoted into measured outcomes or used to validate current adaptation.

## Longitudinal calculations

| Current series | Count | Mean HR | Mean corrected drift | Median drift |
| --- | ---: | ---: | ---: | ---: |
| Walking, ledger including flagged S25 | 25 | 106.08 bpm | 2.14% | 2.50% |
| Rucking, all loads | 18 | 111.56 bpm | 1.49% | 1.40% |
| Running, all protocol contexts | 20 | 148.75 bpm | 1.75% | 2.25% |

The cross-protocol running summary describes coverage; it is not a performance ranking. HR-per-mile is average HR divided by distance, not heartbeats expended per mile. Load-adjusted HR-per-mile is an exploratory arithmetic normalization, not measured mechanical or metabolic efficiency.

The first 20 versus latest 20 hikes average 127.15 versus 124.28 bpm and Garmin exercise load 118.75 versus 60.55. Route, season, altitude, duration, surface, pacing and training history remain confounders. This comparison does not isolate adaptation. The earlier 36-hike statistics remain available as an explicitly historical snapshot. No new HRV-change-score recovery claim is introduced.

## Publication and compatibility

- Homepage, Walking, Rucking, Running, Hiking, Longevity, Biomarkers and Foundation Comparison are reconciled to the source. The fixed 93-session historical audit is not relabeled as a current 103-session audit.
- Webflow content remains staged for Mike to publish. Existing page architecture, navigation, forms and CMS surfaces are preserved. Complete replacement HTML and head/footer blocks accompany the release for existing embed hubs; native-page edits are recorded separately.
- HikeWorldModel becomes v3.2.0; conditioning datasets become v1.3.0. Existing dataset identifiers, endpoints, tool names and public aggregate-plus-selected-session scope remain stable.
- Raw workbook rows and biometric streams are not committed to the public repository. Source filename and SHA-256 provide provenance. Source corrections must be made in the canonical workbook before a subsequent sync removes pending flags.

## Validation

Source counts, corrected drift units, missingness and key totals were reconciled against the uploaded workbook. Automated coverage checks protect the 103-entry spine, S25 warning, S20 corrected drift, H40 missing recovery, and Ruck S12 missing flag. JSON, registry, worker transport and browser-tool checks are run for the release.
