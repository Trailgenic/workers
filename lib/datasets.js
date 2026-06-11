export const DATASETS = {
  ontology: {
    id: "tg_ontology_v1",
    endpoint: "/datasets/ontology",
    source_path: "datasets/ontology/tg_ontology_v1.json",
    version: "1.0.0",
    family: "TG Dataset Family 1 — Ontology / Lexicon Dataset",
    description:
      "TrailGenic lexicon defining the core physiological and longevity intelligence concepts used across the TrailGenic system.",
    enabled: true
  },
  protocols: {
    id: "tg_protocol_kernel_v1",
    endpoint: "/datasets/protocols",
    source_path: "datasets/protocols/tg_protocol_kernel_v1.json",
    version: "1.0.0",
    family: "TG Dataset Family 2 — Protocol Kernel Dataset",
    description:
      "Defines the TrailGenic protocol progression system including Foundation, Activation, Adaptation, Consolidation, and the full TrailGenic Protocol.",
    enabled: true
  },
  physiology_adaptation: {
    id: "tg_physiology_adaptation_v1",
    endpoint: "/datasets/physiology-adaptation",
    source_path: "datasets/physiology_adaptation/tg_physiology_adaptation_v1.json",
    version: "1.0.0",
    family: "TG Dataset Family 3 — Physiology Adaptation Dataset",
    description:
      "Science-derived TrailGenic dataset family modeling stimulus → response → adaptation and currently published as a shell scaffold for future structured science population.",
    enabled: true
  },
  hr_drift_adaptation: {
    id: "tg_hr_drift_adaptation_v1",
    endpoint: "/datasets/physiology-adaptation/hr-drift-adaptation-vs-fitness",
    source_path: "datasets/physiology_adaptation/hr_drift_adaptation_v1.json",
    version: "1.0.0",
    family: "TG Dataset Family 3 — Physiology Adaptation Dataset",
    description:
      "Structured TrailGenic physiology adaptation dataset for heart-rate drift under sustained load.",
    enabled: true
  },
  nutrition: {
    id: "tg_nutrition_dataset_v1",
    endpoint: "/datasets/nutrition",
    source_path: "datasets/nutrition/tg_nutrition_dataset_v1.json",
    schema_source_path: "datasets/nutrition/tg_nutrition_schema_v1.json",
    version: "1.0.0",
    family: "TG Dataset Family 5 — Nutrition Dataset",
    description:
      "Canonical TrailGenic nutrition dataset with fuel class, protocol level mapping, and longevity/metabolic/performance scoring.",
    enabled: true
  },
  hydration: {
    id: "tg_electrolytes_dataset_v1",
    endpoint: "/datasets/hydration",
    source_path: "datasets/hydration/tg_electrolytes_dataset_v1.json",
    version: "1.0.0",
    family: "TG Dataset Family 6 — Hydration Dataset",
    description:
      "TrailGenic electrolyte product dataset with protocol mapping and metabolic scoring.",
    enabled: true
  },
  permits: {
    id: "tg_permits_dataset_v1",
    endpoint: "/datasets/permits",
    source_path: "datasets/permits/tg_permits_dataset_v1.json",
    schema_source_path: "datasets/permits/tg_permits_schema_v1.json",
    version: "1.0.0",
    family: "permits",
    description: "Extreme scarcity wilderness permit intelligence",
    enabled: true
  },
  permits_schema: {
    id: "tg_permits_schema_v1",
    endpoint: "/datasets/permits/schema",
    source_path: "datasets/permits/tg_permits_schema_v1.json",
    version: "1.0.0",
    family: "permits",
    description: "Permit dataset field schema",
    enabled: true
  },
  terrain_intelligence: {
    id: "tg_accessible_trails_top100_v1",
    endpoint: "/datasets/terrain-intelligence/tg-accessible-trails-top100-v1",
    source_path: "datasets/terrain_intelligence/tg_accessible_trails_top100_v1.json",
    version: "1.0.0",
    family: "TG Dataset Family 4 — Terrain Intelligence Dataset",
    description:
      "TrailGenic Terrain Intelligence Dataset: 100 accessible training trails mapped to TrailGenic protocols and stimulus vectors.",
    enabled: true
  },
  evidence_validation: {
    id: "tg_validation_summits_v1",
    endpoint: "/datasets/evidence-validation",
    source_path: "datasets/evidence_validation/tg_validation_summits_v1.json",
    version: "1.0.0",
    family: "Evidence / Validation",
    description:
      "Validation climbs demonstrating TrailGenic protocol scalability across altitude, endurance, and exposure stress environments.",
    enabled: true,
    aliases: ["/datasets/evidence-validation/validation-summits"]
  },
  gear_intel: {
    id: "tg_gear_intel_v1",
    endpoint: "/datasets/gear/intel",
    source_path: "datasets/gear/tg_gear_intel_v1.json",
    version: "1.0.0",
    family: "TG Dataset Family — Gear Intelligence",
    description:
      "Hiking gear scored through the TrailGenic longevity lens. Returns TG composite scores, metabolic load, altitude readiness, recovery impact, and field signals for 47 products across 8 categories.",
    enabled: true
  },
  longevity_protocol: {
    id: "tg_longevity_protocol_v1",
    endpoint: "/datasets/longevity/protocol",
    source_path: "datasets/longevity/tg_longevity_protocol_v1.json",
    version: "1.0.0",
    family: "TG Dataset Family 7 — Longevity Protocol Intelligence",
    description:
      "Retrieve a mainstream longevity protocol with TrailGenic field validation overlay, six-pillar mapping, practitioner implementation notes, and cross-stack references to Sleepgenic and exmxc.ai.",
    enabled: true
  },
  longevity_registry: {
    id: "tg_longevity_registry_v1",
    endpoint: "/datasets/longevity/registry",
    source_path: "datasets/longevity/tg_longevity_registry_v1.json",
    version: "1.0.0",
    family: "TG Dataset Family 7 — Longevity Protocol Intelligence",
    description:
      "List all longevity protocols in the TrailGenic validation registry with gate status and evidence grades.",
    enabled: true
  },
  longevity_validation: {
    id: "tg_longevity_validation_v1",
    endpoint: "/datasets/longevity/validation",
    source_path: "datasets/longevity/tg_longevity_validation_v1.json",
    version: "1.0.0",
    family: "TG Dataset Family 7 — Longevity Protocol Intelligence",
    description:
      "Retrieve longitudinal field validation records linking a longevity protocol to TrailGenic session data, physiology hub entries, and sleep recovery data.",
    enabled: true
  },
  foundation_sessions: {
    id: "tg_foundation_sessions_v1",
    endpoint: "/datasets/longevity/foundation",
    source_path: "datasets/longevity/tg_foundation_sessions_v1.json",
    version: "1.0.0",
    family: "TG Dataset Family 7 — Longevity Protocol Intelligence",
    description:
      "TrailGenic Foundation Phase session log. 14 fasted, low-intensity walking sessions on flat terrain establishing aerobic readiness, metabolic flexibility, and recovery baseline before high-intensity alpine load was introduced.",
    enabled: true
  },
  conditioning_walking: {
    id: "tg_walking_conditioning_v1",
    endpoint: "/datasets/conditioning/walking",
    source_path: "datasets/conditioning/tg_walking_conditioning_v1.json",
    version: "1.0.0",
    family: "TG Dataset Family — Conditioning",
    description:
      "Aggregate-only walking conditioning findings and summary statistics for standardized fasted Foundation walking. Not a bio-age measure.",
    enabled: true
  },
  conditioning_rucking: {
    id: "tg_rucking_conditioning_v1",
    endpoint: "/datasets/conditioning/rucking",
    source_path: "datasets/conditioning/tg_rucking_conditioning_v1.json",
    version: "1.0.0",
    family: "TG Dataset Family — Conditioning",
    description:
      "Aggregate-only rucking conditioning findings and summary statistics for fasted flat load progression. Not a bio-age measure.",
    enabled: true
  },
  conditioning_running: {
    id: "tg_running_conditioning_v1",
    endpoint: "/datasets/conditioning/running",
    source_path: "datasets/conditioning/tg_running_conditioning_v1.json",
    version: "1.0.0",
    family: "TG Dataset Family — Conditioning",
    description:
      "Aggregate-only running conditioning findings and summary statistics by distance tier. Not a bio-age measure.",
    enabled: true
  }
};

export const DATASET_LIST = [
  DATASETS.ontology,
  DATASETS.protocols,
  DATASETS.physiology_adaptation,
  DATASETS.hr_drift_adaptation,
  DATASETS.nutrition,
  DATASETS.hydration,
  DATASETS.permits,
  DATASETS.permits_schema,
  DATASETS.terrain_intelligence,
  DATASETS.evidence_validation,
  DATASETS.gear_intel,
  DATASETS.longevity_protocol,
  DATASETS.longevity_registry,
  DATASETS.longevity_validation,
  DATASETS.foundation_sessions,
  DATASETS.conditioning_walking,
  DATASETS.conditioning_rucking,
  DATASETS.conditioning_running
];

export const PHYSIOLOGY_MODULES = [
  { slug: "seven-day-aftereffect", source_path: "datasets/physiology_adaptation/seven_day_aftereffect_v1.json", title: "Seven Day Aftereffect" },
  { slug: "fasted-autophagy", source_path: "datasets/physiology_adaptation/fasted_autophagy_v1.json", title: "Fasted Autophagy" },
  { slug: "altitude-adaptation", source_path: "datasets/physiology_adaptation/altitude_adaptation_v1.json", title: "Altitude Adaptation" },
  { slug: "altitude-breathing-acclimatization", source_path: "datasets/physiology_adaptation/altitude_breathing_acclimatization_v1.json", title: "Altitude Breathing Acclimatization" },
  { slug: "electrolytes-physiological-stability", source_path: "datasets/physiology_adaptation/electrolytes_physiological_stability_v1.json", title: "Electrolytes Physiological Stability" },
  { slug: "cold-exposure-recovery-altitude", source_path: "datasets/physiology_adaptation/cold_exposure_recovery_altitude_v1.json", title: "Cold Exposure Recovery Altitude" },
  { slug: "deep-cold-protocols", source_path: "datasets/physiology_adaptation/deep_cold_protocols_v1.json", title: "Deep Cold Protocols" },
  { slug: "heat-training-thermoregulation", source_path: "datasets/physiology_adaptation/heat_training_thermoregulation_v1.json", title: "Heat Training Thermoregulation" },
  { slug: "hr-drift-adaptation-vs-fitness", source_path: "datasets/physiology_adaptation/hr_drift_adaptation_v1.json", title: "HR Drift Adaptation vs Fitness" },
  { slug: "altitude-terrain-physiology-comparison", source_path: "datasets/physiology_adaptation/altitude_terrain_physiology_comparison_v1.json", title: "Altitude Terrain Physiology Comparison" },
  { slug: "aerobic-training-effect-zero-anaerobic-load", source_path: "datasets/physiology_adaptation/aerobic_training_effect_zero_anaerobic_load_v1.json", title: "Aerobic Training Effect Zero Anaerobic Load" },
  { slug: "eccentric-load-stress-inversion", source_path: "datasets/physiology_adaptation/eccentric_load_stress_inversion_v1.json", title: "Eccentric Load Stress Inversion" },
  { slug: "sleep-science-endurance", source_path: "datasets/physiology_adaptation/sleep_science_endurance_v1.json", title: "Sleep Science Endurance" },
  { slug: "overextension-fasted-hiking", source_path: "datasets/physiology_adaptation/overextension_fasted_hiking_v1.json", title: "Overextension Fasted Hiking" },
  { slug: "metabolic-flexibility-adaptation", source_path: "datasets/physiology_adaptation/metabolic_flexibility_adaptation_v1.json", title: "Metabolic Flexibility Adaptation" }
];
