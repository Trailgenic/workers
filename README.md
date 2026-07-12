# TrailGenic MCP Worker

This repository contains the public TrailGenic Machine Communication Protocol (MCP) worker and dataset discovery infrastructure.

TrailGenic is a longevity intelligence system providing structured protocols, trail intelligence, physiology models, fueling systems, recovery protocols, and performance playbooks.

## Canonical Discovery

Canonical MCP discovery is hosted at:

- `https://mcp.trailgenic.com/`
- `https://mcp.trailgenic.com/.well-known/tool-registry.json`
- `https://mcp.trailgenic.com/.well-known/openapi.json`
- `https://mcp.trailgenic.com/capabilities.json`

The MCP transport is now a real JSON-RPC 2.0 endpoint at `POST /mcp`:

```bash
curl -s https://mcp.trailgenic.com/mcp \
  -H 'content-type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
```

`GET /mcp` is intentionally not callable and returns `405 Allow: POST`. The transport is synchronous and non-streaming, with Streamable-HTTP-compatible request/response behavior.

## Auth and Data Scope

Authentication is `none` because TrailGenic MCP exposes public, read-only datasets and deterministic data tools. No Twilio, Cloudflare, permit-subscription, or other operational secrets are stored in source.

The permit SMS infrastructure is operationally separate from this MCP worker and is not part of MCP deployment or CI scope. Permit-subscription privacy handling must remain in the operational permit system, not in public MCP dataset/tool responses.

## Callable MCP Tools

The public MCP tool inventory is generated from one canonical registry and currently includes 19 callable tools:

| Tool | Parameters |
| --- | --- |
| `tg.datasets.index.get` | none |
| `tg.ontology.get` | `category` |
| `tg.protocols.get` | `protocol_id` |
| `tg.physiology.adaptation.get` | `module` |
| `tg.hiking.worldModel.get` | none |
| `tg.physiology.hrDriftAdaptation.get` | none |
| `tg.nutrition.get` | `food_category`, `tg_fuel_class`, `limit` |
| `tg.hydration.get` | `category`, `limit` |
| `tg.permits.dataset.get` | `scarcity_tier` |
| `tg.terrain.accessibleTrails.get` | `region`, `accessibility_class`, `protocol_level_estimate`, `limit` |
| `tg.evidence.validationSummits.get` | `region`, `limit` |
| `tg.gear.intel.get` | `category`, `limit` |
| `tg.gear.getIntel` | `category` (optional) |
| `tg.longevity.protocol.get` | `protocol_id`, `category` |
| `tg.longevity.foundationSessions.get` | none |
| `tg.conditioning.walking.get` | `start_date`, `end_date` (optional; aggregate-only) |
| `tg.conditioning.rucking.get` | `start_date`, `end_date` (optional; aggregate-only) |
| `tg.conditioning.running.get` | `start_date`, `end_date` (optional; aggregate-only) |
| `tg.longevity.bioAge.compute` | `age`, `resting_hr`, `distance_mi`, `elevation_gain_ft`, `moving_time_min`, `avg_hr` (required); `max_hr`, `overnight_hrv`, `fasted` (optional) |

The current public movement model covers 59 structured sessions: 16 walking sessions (14 canonical Foundation sessions plus 2 additional walking sessions), 4 rucking sessions, 8 running sessions, and 31 hiking sessions. HikeWorldModel™ v2.0 is published as aggregate-only data with selected high-signal summaries, not raw biometric telemetry.

Large dataset tools support optional filters and bounded `limit` values so MCP clients do not need to ingest full high-record payloads.

### Deferred Dataset Tools

`tg.longevity.registry.get` and `tg.longevity.validation.get` are intentionally deferred because their backing dataset files are currently placeholder shells. Their public dataset routes remain available and will be eligible for callable MCP tools once populated.

### Content Links

HTML-only TrailGenic website capabilities are preserved as `content_links` in discovery documents, not advertised as callable MCP tools. Examples include protocols, trail logs, science hub, physiology hub, fuel systems, gear systems, recovery conditioning, playbooks, Ella's Corner, and site search on `www.trailgenic.com`.

## Dataset Endpoints

Dataset endpoints remain public and machine-readable:

- `https://mcp.trailgenic.com/datasets/index`
- `https://mcp.trailgenic.com/datasets/ontology`
- `https://mcp.trailgenic.com/datasets/protocols`
- `https://mcp.trailgenic.com/datasets/hiking`
- `https://mcp.trailgenic.com/datasets/hiking/world-model`
- `https://mcp.trailgenic.com/datasets/physiology-adaptation`
- `https://mcp.trailgenic.com/datasets/nutrition`
- `https://mcp.trailgenic.com/datasets/nutrition/schema`
- `https://mcp.trailgenic.com/datasets/hydration`
- `https://mcp.trailgenic.com/datasets/permits`
- `https://mcp.trailgenic.com/datasets/permits/schema`
- `https://mcp.trailgenic.com/datasets/terrain-intelligence/tg-accessible-trails-top100-v1`
- `https://mcp.trailgenic.com/datasets/evidence-validation`
- `https://mcp.trailgenic.com/datasets/evidence-validation/validation-summits`
- `https://mcp.trailgenic.com/datasets/gear/intel`
- `https://mcp.trailgenic.com/datasets/longevity/protocol`
- `https://mcp.trailgenic.com/datasets/longevity/registry`
- `https://mcp.trailgenic.com/datasets/longevity/validation`
- `https://mcp.trailgenic.com/datasets/longevity/foundation`
- `https://mcp.trailgenic.com/datasets/conditioning/walking`
- `https://mcp.trailgenic.com/datasets/conditioning/rucking`
- `https://mcp.trailgenic.com/datasets/conditioning/running`

Physiology adaptation is now an active module catalog; detailed records remain in the module endpoints. Physiology adaptation module endpoints are also preserved:

- `https://mcp.trailgenic.com/datasets/physiology-adaptation/seven-day-aftereffect`
- `https://mcp.trailgenic.com/datasets/physiology-adaptation/fasted-autophagy`
- `https://mcp.trailgenic.com/datasets/physiology-adaptation/altitude-adaptation`
- `https://mcp.trailgenic.com/datasets/physiology-adaptation/altitude-breathing-acclimatization`
- `https://mcp.trailgenic.com/datasets/physiology-adaptation/electrolytes-physiological-stability`
- `https://mcp.trailgenic.com/datasets/physiology-adaptation/cold-exposure-recovery-altitude`
- `https://mcp.trailgenic.com/datasets/physiology-adaptation/deep-cold-protocols`
- `https://mcp.trailgenic.com/datasets/physiology-adaptation/heat-training-thermoregulation`
- `https://mcp.trailgenic.com/datasets/physiology-adaptation/hr-drift-adaptation-vs-fitness`
- `https://mcp.trailgenic.com/datasets/physiology-adaptation/altitude-terrain-physiology-comparison`
- `https://mcp.trailgenic.com/datasets/physiology-adaptation/aerobic-training-effect-zero-anaerobic-load`
- `https://mcp.trailgenic.com/datasets/physiology-adaptation/eccentric-load-stress-inversion`
- `https://mcp.trailgenic.com/datasets/physiology-adaptation/sleep-science-endurance`
- `https://mcp.trailgenic.com/datasets/physiology-adaptation/overextension-fasted-hiking`
- `https://mcp.trailgenic.com/datasets/physiology-adaptation/metabolic-flexibility-adaptation`

## Health and Observability

`/health` does not fabricate uptime. It reports `uptime: null` and notes that uptime is observed via Cloudflare observability.

## Local and Live Checks

Run the live acceptance harness after deployment:

```bash
node scripts/live-acceptance.mjs
```

Override the target base URL when testing a deployed preview or local Worker runtime:

```bash
BASE=https://mcp.trailgenic.com node scripts/live-acceptance.mjs
```

## Deployment

CI deploys only `tool-registry` via Wrangler v4:

```bash
npx wrangler@4 deploy --config tool-registry/wrangler.jsonc
```

The permit poller is intentionally excluded from MCP CI/deploy workflows.

## Ownership

TrailGenic is created and operated by Mike Ye.

https://trailgenic.com
