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
  {
    id: "tg.gear.intel",
    endpoint: "https://mcp.trailgenic.com/datasets/gear/intel",
    source_path: "datasets/gear/tg_gear_intel_v1.json",
    version: "v1",
    family: "gear",
    enabled: true
  }
];
