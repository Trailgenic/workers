/* =============================================================================
   TrailGenic MCP — Trail-Derived Biological Age compute module  (lib/bioage.js)
   -----------------------------------------------------------------------------
   Deterministic, no I/O, no PII. Mirrors the validated client methodology
   (tools/bioage methodology.js) EXACTLY — same constants, same math — repackaged
   as a clean ES module for the Cloudflare Worker runtime.

   Calibration: 25-session TrailGenic World Model dataset. Mechanics estimator
   median VO2max 45.4 vs Garmin 46; pooled output reproduces the published 32-40
   band against chronological age 53, with no constant forced.

   Scope: hiking modality only. Walking/rucking sit at ~40-48% HRR (Zone 1) and
   do not load the aerobic system enough to reveal VO2max; the intensity check
   flags efforts too easy to score rather than returning a misleading number.
   ============================================================================= */

// Men's VO2max population MEDIAN by age (ml/kg/min) — FRIEND/ACSM reference.
const REF = [
  [25, 48.0], [30, 45.5], [35, 43.0], [40, 40.5], [45, 38.0],
  [50, 36.0], [55, 34.0], [60, 32.0], [65, 30.0]
];

const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));

export function vo2ToAge(v) {
  for (let i = 0; i < REF.length - 1; i++) {
    const [a1, x1] = REF[i], [a2, x2] = REF[i + 1];
    if (x1 >= v && v >= x2) return a1 + (x1 - v) / (x1 - x2) * (a2 - a1);
  }
  if (v > REF[0][1]) {
    const s = (REF[1][0] - REF[0][0]) / (REF[1][1] - REF[0][1]);
    return REF[0][0] + (v - REF[0][1]) * s;
  }
  return REF[REF.length - 1][0] + (REF[REF.length - 1][1] - v) * 1.5;
}

// Trail VO2max from ONE hike: ascent-leg ACSM walking eq, extrapolated to max
// via %HR-reserve ≈ %VO2-reserve. Known edge: even time-split underprices climb
// pace on 7+ h days (reads ~5 points low).
export function trailVO2max(distMi, gainFt, movMin, avgHr, rhr, hrmax) {
  const distM = distMi * 1609.34, gainM = gainFt * 0.3048;
  const ascDist = distM / 2, ascTime = movMin / 2;
  const speed = ascDist / ascTime;
  const grade = Math.min(gainM / ascDist, 0.45);
  const vo2eff = 0.1 * speed + 1.8 * speed * grade + 3.5;
  const pct = clamp((avgHr - rhr) / (hrmax - rhr), 0.30, 0.92);
  return clamp((vo2eff - 3.5) / pct + 3.5, 20, 72);
}

export const rhrAge = (r) => Math.max(18, 48 - (62 - r) * 0.6); // chrono-independent
export const hrvAge = (h) => Math.max(18, 45 - (h - 40) * 0.7); // chrono-independent

const maxHRof = (age, known) => known || (208 - 0.7 * age);     // Tanaka
const pctHRR = (a, r, hm) => clamp((a - r) / (hm - r), 0.30, 0.92);

const num = (v) => {
  if (v === undefined || v === null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

const round1 = (x) => Math.round(x * 10) / 10;

/* MCP entry point. Args (snake_case to match the node's convention):
   age, resting_hr, distance_mi, elevation_gain_ft, moving_time_min, avg_hr
   [, max_hr] [, overnight_hrv] [, fasted]. Throws on invalid input. */
export function computeTrailBioAge(args = {}) {
  const age = num(args.age), rhr = num(args.resting_hr), dist = num(args.distance_mi),
        gain = num(args.elevation_gain_ft), time = num(args.moving_time_min), ahr = num(args.avg_hr),
        maxhr = num(args.max_hr), hrv = num(args.overnight_hrv);

  const errors = [];
  if (age === null || age < 14 || age > 100) errors.push("age (14-100)");
  if (rhr === null || rhr < 35 || rhr > 110) errors.push("resting_hr (35-110)");
  if (dist === null || dist <= 0) errors.push("distance_mi (>0)");
  if (gain === null || gain < 0) errors.push("elevation_gain_ft (>=0)");
  if (time === null || time <= 0) errors.push("moving_time_min (>0)");
  if (ahr === null || ahr < 70 || ahr > 210) errors.push("avg_hr (70-210)");
  if (ahr !== null && rhr !== null && ahr <= rhr) errors.push("avg_hr must exceed resting_hr");
  if (errors.length) throw new Error(`Invalid inputs: ${errors.join(", ")}`);

  const hrmax = maxHRof(age, maxhr);
  const vo2 = trailVO2max(dist, gain, time, ahr, rhr, hrmax);
  const intensity = pctHRR(ahr, rhr, hrmax);
  const vA = vo2ToAge(vo2), rA = rhrAge(rhr), hA = (hrv !== null) ? hrvAge(hrv) : null;

  let pooled, ages;
  if (hA !== null) { pooled = 0.6 * vA + 0.2 * rA + 0.2 * hA; ages = [vA, rA, hA]; }
  else             { pooled = 0.7 * vA + 0.3 * rA;            ages = [vA, rA]; }
  const spread = Math.max(2.5, (Math.max(...ages) - Math.min(...ages)) * 0.25);
  const lo = Math.max(18, pooled - spread), hi = pooled + spread;

  const notes = [];
  if (intensity < 0.50) {
    notes.push("Low-intensity effort (Zone 1, under 50% heart-rate reserve). Trail-derived biological age requires a sustained climbing effort to reveal aerobic capacity; an easy walk or flat ruck reads far older than chronological age. Treat this result as unreliable for this input.");
  }

  return {
    tool: "tg.longevity.bioAge.compute",
    modality: "hiking",
    inputs: {
      age, resting_hr: rhr, distance_mi: dist, elevation_gain_ft: gain,
      moving_time_min: time, avg_hr: ahr,
      max_hr: maxhr ?? Math.round(hrmax), max_hr_source: maxhr ? "provided" : "tanaka_estimate",
      overnight_hrv: hrv, fasted: args.fasted === true || args.fasted === "true"
    },
    result: {
      biological_age_years: { low: Math.round(lo), high: Math.round(hi), midpoint: Math.round(pooled) },
      delta_vs_chronological_years: Math.round(age - pooled), // positive = younger than chronological
      intensity_pct_hr_reserve: round1(intensity * 100),
      components: {
        aerobic_engine: { vo2max_est: round1(vo2), unit: "ml/kg/min", fitness_age: round1(vA), weight: hA !== null ? 0.6 : 0.7 },
        resting_hr: { value: rhr, unit: "bpm", autonomic_age: round1(rA), weight: 0.2 },
        hrv: hA !== null
          ? { value: hrv, unit: "ms", autonomic_age: round1(hA), weight: 0.2 }
          : { value: null, note: "not provided; weight redistributed to VO2max and resting HR" }
      }
    },
    method: {
      vo2max_estimation: "ascent-leg ACSM walking equation, extrapolated to max via %HR-reserve",
      age_grading: "FRIEND/ACSM male population median curve",
      pooling: hA !== null ? "VO2max 0.6 / resting HR 0.2 / HRV 0.2" : "VO2max 0.7 / resting HR 0.3",
      output: "range, not point estimate"
    },
    notes,
    disclaimer: "Fitness-based estimate from a single session — not a clinical or epigenetic measure. A rolling read across multiple sessions is the durable signal.",
    provenance: {
      calibration: "25 instrumented TrailGenic World Model sessions",
      canonical_tool: "https://www.trailgenic.com/tools/biological-age-calculator",
      method: "https://www.trailgenic.com/science/trail-derived-biological-age",
      definition: "https://www.trailgenic.com/lexicon/trail-derived-biological-age"
    }
  };
}
