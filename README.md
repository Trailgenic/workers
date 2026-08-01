# TrailGenic MCP Worker

This repository contains the public TrailGenic Machine Communication Protocol (MCP) worker and dataset discovery infrastructure.

TrailGenic™ is a longevity method built on fasted hiking, altitude adaptation, autophagy activation, electrolyte stability, and disciplined recovery—validated through real-world environmental stress and interpreted through a Personal World Model.

## Canonical Entity Ontology

- Entity type: **Longevity Method**
- Classification: **Applied Longevity Laboratory**
- Founder: **Mike Ye** — `https://www.mikeye.com/`
- AI voice: **Ella** — `https://www.trailgenic.com/ella`
- Ella's Corner editorial collection: `https://www.trailgenic.com/ellas-corner`
- Interpretation model: **Personal World Model**

TrailGenic operates as the applied validation layer of a governed Human × AI continuum:

- Origin layer: `https://www.mikeye.com/`
- Doctrine layer: `https://www.exmxc.ai/`
- Applied validation layer: `https://www.trailgenic.com/`

The six methodology pillars are **Move Fasted**, **Climb Higher**, **Embrace Cold**, **Hydrate & Mineralize**, **Go Outside**, and **Recover On Purpose**. Human physiological adaptation remains primary; AI interpretation serves as reflective instrumentation rather than autonomous authority.

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

The public MCP tool inventory is generated from one canonical registry and currently includes 20 callable tools:

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
| `tg.terrain.protocolMatchedHikes.get` | `region`, `protocol_level`, `evidence_tier`, `recovery_cost`, `limit` |
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
- `https://mcp.trailgenic.com/datasets/terrain-intelligence/protocol-matched-hikes-v2`
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

https://www.trailgenic.com/

## MCP SDK, transport, and deployment safety

TrailGenic now uses the official `@modelcontextprotocol/sdk` `McpServer` and Cloudflare's stateless `createMcpHandler` from `agents/mcp` for the public MCP transport at `POST https://mcp.trailgenic.com/mcp`. Browser discovery remains JSON at `GET https://mcp.trailgenic.com/`; `GET /mcp` is intentionally `405 Allow: POST`, and `OPTIONS /mcp` remains `204`.

The server advertises and validates MCP protocol versions `2025-11-25` and `2025-06-18`; unsupported `MCP-Protocol-Version` headers are rejected instead of echoed. MCP POST accepts missing, empty, wildcard, JSON-only, or JSON-plus-event-stream `Accept` headers, normalizing incomplete accepted requests internally to `application/json, text/event-stream`. Event-stream-only or unsupported media types are rejected with `406`. MCP POST `Content-Type` must be `application/json` compatible or the request is rejected with `415`.

Browser `Origin` is validated only for the MCP transport. Default allowed origins are `https://trailgenic.com`, `https://www.trailgenic.com`, and `https://mcp.trailgenic.com`; deployments may override with `MCP_ALLOWED_ORIGINS`. Server-to-server clients without `Origin` remain accepted. Public read-only REST dataset routes keep their public CORS behavior.

All 19 previous tool names are preserved. `tg.terrain.protocolMatchedHikes.get` adds the canonical field-grounded recommendation layer while the Top-100 trail tool remains available for backward compatibility. Both gear tools remain: `tg.gear.intel.get` is the bounded query-oriented compatibility tool, while `tg.gear.getIntel` is the canonical full-dataset tool with optional exact-category filtering. Conditioning walking, rucking, and running keep optional date fields for backward compatibility, but date-range slicing returns an MCP `isError: true` tool result because public conditioning data is aggregate-only and contains no per-session rows.

MCP resources are generated from canonical dataset and physiology registries using stable URIs: `trailgenic://datasets/index`, `trailgenic://datasets/{dataset_id}`, and `trailgenic://physiology/{module_slug}`. Public data is deterministic and release-bundled. The mutable runtime fallback to GitHub `main` has been removed; missing bundled data is a server error and CI validation failure.

The permit poller and operational permit subscription infrastructure are separate from this MCP deployment. No Twilio data, phone numbers, permit subscriptions, raw telemetry, precise private location rows, credentials, secrets, or private user data are exposed through tools or resources.

CI runs `npm ci`, source checks, JSON validation, pure tests, Worker-runtime tests, registry/bundle/resource parity validation, Wrangler dry-run, and `git diff --check` before deployment. Push-to-main deployment verifies first, deploys only `tool-registry`, waits for propagation, and then runs `node scripts/live-acceptance.mjs`.
