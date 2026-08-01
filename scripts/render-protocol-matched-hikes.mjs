import dataset from "../datasets/terrain_intelligence/tg_protocol_matched_hikes_v2.json" with { type: "json" };

const escapeHtml = (value) => String(value ?? "")
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");

const protocolMeta = {
  1: { name: "Foundation", purpose: "Build rhythm, consistency, and low-cost terrain tolerance." },
  2: { name: "Activation", purpose: "Introduce controlled climb and duration without excessive recovery debt." },
  3: { name: "Adaptation", purpose: "Sustain meaningful climb, duration, and terrain stress with stable recovery." },
  4: { name: "Consolidation", purpose: "Absorb longer mountain work, altitude, and compounded environmental load." },
  5: { name: "TrailGenic", purpose: "Integrate the full system under high consequence, altitude, duration, and recovery cost." }
};

const fieldValidatedCount = dataset.hikes.filter((hike) => hike.evidence_tier.toLowerCase().includes("founder")).length;

const cardsFor = (level) => dataset.hikes
  .filter((hike) => hike.protocol_level === level)
  .map((hike) => `
    <article class="tgpm-card">
      <div class="tgpm-card__top">
        <span class="tgpm-badge">Protocol ${hike.protocol_level} · ${escapeHtml(hike.protocol_name)}</span>
        <span class="tgpm-evidence">${escapeHtml(hike.evidence_tier)}</span>
      </div>
      <h4>${escapeHtml(hike.trail_name)}</h4>
      <p class="tgpm-location">${escapeHtml(hike.location)}</p>
      <div class="tgpm-stats" aria-label="Approximate route profile">
        <span>${escapeHtml(hike.distance_miles_approx)} mi</span>
        <span>${Number(hike.elevation_gain_ft_approx).toLocaleString("en-US")} ft gain</span>
        <span>${Number(hike.peak_elevation_ft_approx).toLocaleString("en-US")} ft peak</span>
      </div>
      <dl>
        <div><dt>Protocol job</dt><dd>${escapeHtml(hike.primary_stimulus)}</dd></div>
        <div><dt>Recovery cost</dt><dd>${escapeHtml(hike.recovery_cost)}</dd></div>
        <div><dt>Repeatability</dt><dd>${escapeHtml(hike.repeatability)}</dd></div>
        <div><dt>Minimum readiness</dt><dd>${escapeHtml(hike.minimum_readiness)}</dd></div>
        <div><dt>Season guidance</dt><dd>${escapeHtml(hike.season_guidance)}</dd></div>
      </dl>
      <p class="tgpm-why"><strong>Why it is here:</strong> ${escapeHtml(hike.why_selected)}</p>
    </article>`)
  .join("");

const sections = Object.entries(protocolMeta).map(([level, meta]) => `
  <section class="tgpm-level" id="protocol-${level}">
    <header class="tgpm-level__head">
      <div><span class="tgpm-kicker">Protocol ${level}</span><h3>${escapeHtml(meta.name)}</h3></div>
      <p>${escapeHtml(meta.purpose)}</p>
    </header>
    <div class="tgpm-grid">${cardsFor(Number(level))}</div>
  </section>`).join("");

const itemList = {
  "@type": "ItemList",
  "@id": "https://www.trailgenic.com/protocols/trailgenic-protocol-trail-library#hikes",
  name: "TrailGenic Protocol-Matched Hikes",
  numberOfItems: dataset.hikes.length,
  itemListElement: dataset.hikes.map((hike, index) => ({
    "@type": "ListItem",
    position: index + 1,
    item: {
      "@type": "Place",
      additionalType: "HikingTrail",
      identifier: hike.trail_id,
      name: hike.trail_name,
      address: { "@type": "PostalAddress", addressRegion: "CA", addressLocality: hike.location },
      description: `Protocol ${hike.protocol_level} ${hike.protocol_name}; ${hike.primary_stimulus}; recovery cost ${hike.recovery_cost}; ${hike.evidence_tier}.`,
      additionalProperty: [
        { "@type": "PropertyValue", name: "protocolLevel", value: hike.protocol_level },
        { "@type": "PropertyValue", name: "protocolName", value: hike.protocol_name },
        { "@type": "PropertyValue", name: "distanceMilesApprox", value: hike.distance_miles_approx },
        { "@type": "PropertyValue", name: "elevationGainFeetApprox", value: hike.elevation_gain_ft_approx },
        { "@type": "PropertyValue", name: "recoveryCost", value: hike.recovery_cost },
        { "@type": "PropertyValue", name: "evidenceTier", value: hike.evidence_tier }
      ]
    }
  }))
};

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": ["Dataset", "Article"],
      "@id": "https://www.trailgenic.com/protocols/trailgenic-protocol-trail-library#dataset",
      name: dataset.name,
      description: dataset.description,
      url: "https://www.trailgenic.com/protocols/trailgenic-protocol-trail-library",
      inLanguage: "en",
      isAccessibleForFree: true,
      numberOfItems: dataset.hikes.length,
      dateModified: dataset.dateModified,
      author: [
        { "@id": "https://www.trailgenic.com/#mike" },
        { "@id": "https://www.trailgenic.com/#ella" }
      ],
      publisher: { "@id": "https://www.trailgenic.com/#org" },
      isPartOf: { "@id": "https://www.trailgenic.com/#protocol-series" },
      distribution: [{
        "@type": "DataDownload",
        encodingFormat: "application/json",
        contentUrl: "https://mcp.trailgenic.com/datasets/terrain-intelligence/protocol-matched-hikes-v2",
        name: "TrailGenic Protocol-Matched Hikes v2 — machine-readable dataset"
      }],
      mainEntity: { "@id": itemList["@id"] }
    },
    itemList
  ]
};

const html = `<div data-rt-embed-type="true"><!-- ========= TrailGenic | Protocol-Matched Hikes — v2.0 ========= -->
<style>
#tg-protocol-hikes{--ink:#eaf4ef;--muted:#a8b9b0;--line:rgba(174,220,197,.18);--panel:#10241d;--panel2:#153128;--accent:#87d8ad;--accent2:#d2b36b;background:linear-gradient(150deg,#081711 0%,#0e251c 52%,#102d22 100%);color:var(--ink);border:1px solid var(--line);border-radius:24px;padding:clamp(22px,4vw,52px);font-family:Inter,Arial,sans-serif;line-height:1.6}
#tg-protocol-hikes *{box-sizing:border-box}#tg-protocol-hikes h2,#tg-protocol-hikes h3,#tg-protocol-hikes h4{color:var(--ink);margin-top:0;line-height:1.15}#tg-protocol-hikes h2{font-size:clamp(34px,6vw,64px);letter-spacing:-.035em;max-width:900px;margin-bottom:18px}#tg-protocol-hikes h3{font-size:clamp(27px,4vw,42px);margin-bottom:4px}#tg-protocol-hikes h4{font-size:21px;margin:16px 0 4px}#tg-protocol-hikes p{color:var(--muted);margin-top:0}#tg-protocol-hikes a{color:var(--accent)}
.tgpm-eyebrow,.tgpm-kicker{display:block;color:var(--accent);font-size:12px;font-weight:800;letter-spacing:.14em;text-transform:uppercase}.tgpm-lede{font-size:clamp(17px,2.2vw,22px);max-width:830px}.tgpm-metrics{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin:28px 0}.tgpm-metric{background:rgba(255,255,255,.045);border:1px solid var(--line);border-radius:16px;padding:18px}.tgpm-metric strong{display:block;color:var(--ink);font-size:28px}.tgpm-metric span{color:var(--muted);font-size:13px}.tgpm-note{border-left:3px solid var(--accent2);background:rgba(210,179,107,.08);padding:18px 20px;border-radius:0 14px 14px 0;margin:24px 0}.tgpm-note strong{color:#f0dfb7}.tgpm-principles{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin:28px 0 44px}.tgpm-principle{background:var(--panel);border:1px solid var(--line);border-radius:16px;padding:18px}.tgpm-principle strong{display:block;color:var(--ink);margin-bottom:5px}.tgpm-principle p{margin:0;font-size:14px}
.tgpm-level{padding:42px 0;border-top:1px solid var(--line)}.tgpm-level__head{display:grid;grid-template-columns:minmax(220px,.7fr) minmax(260px,1.3fr);gap:28px;align-items:end;margin-bottom:22px}.tgpm-level__head p{margin:0}.tgpm-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}.tgpm-card{background:linear-gradient(145deg,var(--panel),var(--panel2));border:1px solid var(--line);border-radius:18px;padding:20px;box-shadow:0 14px 35px rgba(0,0,0,.14)}.tgpm-card__top{display:flex;justify-content:space-between;gap:10px;align-items:flex-start}.tgpm-badge,.tgpm-evidence{font-size:10px;font-weight:800;letter-spacing:.08em;text-transform:uppercase}.tgpm-badge{color:var(--accent)}.tgpm-evidence{color:var(--accent2);text-align:right}.tgpm-location{font-size:13px;margin-bottom:12px!important}.tgpm-stats{display:flex;flex-wrap:wrap;gap:7px;margin:12px 0}.tgpm-stats span{border:1px solid var(--line);border-radius:999px;padding:5px 9px;color:#cce0d5;font-size:11px}.tgpm-card dl{margin:14px 0 0}.tgpm-card dl div{display:grid;grid-template-columns:112px 1fr;gap:10px;padding:8px 0;border-top:1px solid var(--line)}.tgpm-card dt{color:#7fa08f;font-size:11px;text-transform:uppercase;letter-spacing:.06em}.tgpm-card dd{margin:0;color:#d7e5de;font-size:13px}.tgpm-why{font-size:13px;margin:14px 0 0!important}.tgpm-why strong{color:var(--ink)}.tgpm-footer{padding-top:36px;border-top:1px solid var(--line)}.tgpm-links{display:flex;flex-wrap:wrap;gap:10px}.tgpm-links a{display:inline-block;border:1px solid var(--line);border-radius:999px;padding:9px 13px;text-decoration:none;font-size:13px}
@media screen and (max-width:767px){.tgpm-metrics,.tgpm-principles,.tgpm-grid,.tgpm-level__head{grid-template-columns:1fr}.tgpm-level__head{gap:8px}.tgpm-card__top{display:block}.tgpm-evidence{display:block;text-align:left;margin-top:5px}.tgpm-card dl div{grid-template-columns:1fr;gap:2px}}
</style>
<section id="tg-protocol-hikes" aria-labelledby="tgpm-title">
  <header>
    <span class="tgpm-eyebrow">TrailGenic Protocol System · Terrain Intelligence v2.0</span>
    <h2 id="tgpm-title">Choose the route by the job—not the ambition.</h2>
    <p class="tgpm-lede">TrailGenic Protocol-Matched Hikes connects readiness, intended stimulus, terrain, conditions, and recovery cost. It is a progression tool: the same mountain can be appropriate one day and excessive the next.</p>
    <div class="tgpm-metrics">
      <div class="tgpm-metric"><strong>${dataset.hikes.length}</strong><span>bounded starter routes</span></div>
      <div class="tgpm-metric"><strong>${fieldValidatedCount}</strong><span>founder field-grounded routes</span></div>
      <div class="tgpm-metric"><strong>5</strong><span>protocol levels</span></div>
    </div>
    <div class="tgpm-note"><strong>Not a universal recommendation or readiness clearance.</strong> Route specifications are approximate. Check official permits, closures, fire restrictions, weather, snow, heat, water, altitude, and rescue guidance before every attempt.</div>
  </header>
  <section aria-labelledby="tgpm-how">
    <h3 id="tgpm-how">How Ella matches a hike</h3>
    <div class="tgpm-principles">
      <div class="tgpm-principle"><strong>1 · Readiness before difficulty</strong><p>Current recovery state, recent load, experience, and conditions come before the trail's reputation.</p></div>
      <div class="tgpm-principle"><strong>2 · One route, one primary job</strong><p>Each route is retained because it contributes a distinct climb, duration, altitude, terrain, or exposure signal.</p></div>
      <div class="tgpm-principle"><strong>3 · Conditions can reclassify the route</strong><p>Heat, snow, ice, wind, load, fasting, closures, and pace can move a route into a higher-cost category.</p></div>
      <div class="tgpm-principle"><strong>4 · Recovery governs progression</strong><p>Completion does not automatically authorize the next level. The next route is earned by absorption, not summit success alone.</p></div>
    </div>
  </section>
  ${sections}
  <footer class="tgpm-footer">
    <h3>Evidence labels</h3>
    <p><strong style="color:var(--ink)">Founder field-validated</strong> means Mike completed the route or objective and it sits inside TrailGenic's field record. <strong style="color:var(--ink)">Protocol-mapped candidate</strong> means the route has a defined progression role but has not yet earned the same TrailGenic field-evidence status.</p>
    <p>This v2 library intentionally replaces the unsupported breadth of the former 100-route recommendation concept. The legacy machine endpoint remains available only for compatibility.</p>
    <div class="tgpm-links">
      <a href="https://www.trailgenic.com/protocols">Protocol Series</a>
      <a href="https://www.trailgenic.com/hiking">Hiking Doctrine</a>
      <a href="https://www.trailgenic.com/trail-logs">Field Evidence</a>
      <a href="https://www.trailgenic.com/playbooks">Execution Playbooks</a>
      <a href="https://mcp.trailgenic.com/datasets/terrain-intelligence/protocol-matched-hikes-v2">Machine-readable dataset</a>
    </div>
  </footer>
</section>
<script type="application/ld+json">${JSON.stringify(structuredData).replaceAll("<", "\\u003c")}</script>
<!-- ========= /TrailGenic | Protocol-Matched Hikes — v2.0 ========= --></div>`;

process.stdout.write(html);
