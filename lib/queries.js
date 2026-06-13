import { DATASET_LIST, PHYSIOLOGY_MODULES } from "./datasets.js";
import { datasetCatalog } from "./registry.js";
import { computeTrailBioAge } from "./bioage.js";

import ontology from "../datasets/ontology/tg_ontology_v1.json" with { type: "json" };
import protocols from "../datasets/protocols/tg_protocol_kernel_v1.json" with { type: "json" };
import nutrition from "../datasets/nutrition/tg_nutrition_dataset_v1.json" with { type: "json" };
import nutritionSchema from "../datasets/nutrition/tg_nutrition_schema_v1.json" with { type: "json" };
import hydration from "../datasets/hydration/tg_electrolytes_dataset_v1.json" with { type: "json" };
import permits from "../datasets/permits/tg_permits_dataset_v1.json" with { type: "json" };
import permitsSchema from "../datasets/permits/tg_permits_schema_v1.json" with { type: "json" };
import terrain from "../datasets/terrain_intelligence/tg_accessible_trails_top100_v1.json" with { type: "json" };
import evidence from "../datasets/evidence_validation/tg_validation_summits_v1.json" with { type: "json" };
import gear from "../datasets/gear/gear-intel-dataset-q2-2026.json" with { type: "json" };
import longevityProtocol from "../datasets/longevity/tg_longevity_protocol_v1.json" with { type: "json" };
import foundationSessions from "../datasets/longevity/tg_foundation_sessions_v1.json" with { type: "json" };
import longevityRegistry from "../datasets/longevity/tg_longevity_registry_v1.json" with { type: "json" };
import longevityValidation from "../datasets/longevity/tg_longevity_validation_v1.json" with { type: "json" };
import physiologyAdaptation from "../datasets/physiology_adaptation/tg_physiology_adaptation_v1.json" with { type: "json" };
import hrDriftAdaptation from "../datasets/physiology_adaptation/hr_drift_adaptation_v1.json" with { type: "json" };
import walkingConditioning from "../datasets/conditioning/tg_walking_conditioning_v1.json" with { type: "json" };
import ruckingConditioning from "../datasets/conditioning/tg_rucking_conditioning_v1.json" with { type: "json" };
import runningConditioning from "../datasets/conditioning/tg_running_conditioning_v1.json" with { type: "json" };

import sevenDayAftereffect from "../datasets/physiology_adaptation/seven_day_aftereffect_v1.json" with { type: "json" };
import fastedAutophagy from "../datasets/physiology_adaptation/fasted_autophagy_v1.json" with { type: "json" };
import altitudeAdaptation from "../datasets/physiology_adaptation/altitude_adaptation_v1.json" with { type: "json" };
import altitudeBreathingAcclimatization from "../datasets/physiology_adaptation/altitude_breathing_acclimatization_v1.json" with { type: "json" };
import electrolytesPhysiologicalStability from "../datasets/physiology_adaptation/electrolytes_physiological_stability_v1.json" with { type: "json" };
import coldExposureRecoveryAltitude from "../datasets/physiology_adaptation/cold_exposure_recovery_altitude_v1.json" with { type: "json" };
import deepColdProtocols from "../datasets/physiology_adaptation/deep_cold_protocols_v1.json" with { type: "json" };
import heatTrainingThermoregulation from "../datasets/physiology_adaptation/heat_training_thermoregulation_v1.json" with { type: "json" };
import altitudeTerrainPhysiologyComparison from "../datasets/physiology_adaptation/altitude_terrain_physiology_comparison_v1.json" with { type: "json" };
import aerobicTrainingEffectZeroAnaerobicLoad from "../datasets/physiology_adaptation/aerobic_training_effect_zero_anaerobic_load_v1.json" with { type: "json" };
import eccentricLoadStressInversion from "../datasets/physiology_adaptation/eccentric_load_stress_inversion_v1.json" with { type: "json" };
import sleepScienceEndurance from "../datasets/physiology_adaptation/sleep_science_endurance_v1.json" with { type: "json" };
import overextensionFastedHiking from "../datasets/physiology_adaptation/overextension_fasted_hiking_v1.json" with { type: "json" };
import metabolicFlexibilityAdaptation from "../datasets/physiology_adaptation/metabolic_flexibility_adaptation_v1.json" with { type: "json" };

export const GEAR_INTEL_CATEGORIES = [
  "Backpacks",
  "Trail Shoes",
  "Insulation",
  "Trekking Poles",
  "Electrolytes",
  "Hydration",
  "Shell / Rain",
  "Headlamps"
];

const MODULE_DATA = {
  "seven-day-aftereffect": sevenDayAftereffect,
  "fasted-autophagy": fastedAutophagy,
  "altitude-adaptation": altitudeAdaptation,
  "altitude-breathing-acclimatization": altitudeBreathingAcclimatization,
  "electrolytes-physiological-stability": electrolytesPhysiologicalStability,
  "cold-exposure-recovery-altitude": coldExposureRecoveryAltitude,
  "deep-cold-protocols": deepColdProtocols,
  "heat-training-thermoregulation": heatTrainingThermoregulation,
  "hr-drift-adaptation-vs-fitness": hrDriftAdaptation,
  "altitude-terrain-physiology-comparison": altitudeTerrainPhysiologyComparison,
  "aerobic-training-effect-zero-anaerobic-load": aerobicTrainingEffectZeroAnaerobicLoad,
  "eccentric-load-stress-inversion": eccentricLoadStressInversion,
  "sleep-science-endurance": sleepScienceEndurance,
  "overextension-fasted-hiking": overextensionFastedHiking,
  "metabolic-flexibility-adaptation": metabolicFlexibilityAdaptation
};

const arrayFrom = (dataset, key) => {
  const value = key ? dataset?.[key] : dataset;
  return Array.isArray(value) ? value : [];
};

const normalized = (value) => String(value ?? "").trim().toLowerCase();

const equalsIfPresent = (record, field, expected) => {
  if (expected === undefined || expected === null || expected === "") {
    return true;
  }

  if (!(field in record)) {
    return true;
  }

  return normalized(record[field]) === normalized(expected);
};

const boundedLimit = (limit, fallback = 50) => {
  const parsed = Number.parseInt(limit, 10);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.min(200, Math.max(1, parsed));
};

const sourceLength = (dataset, recordKey) => {
  if (recordKey && Array.isArray(dataset?.[recordKey])) {
    return dataset[recordKey].length;
  }

  return Array.isArray(dataset) ? dataset.length : undefined;
};

const resultSet = ({ dataset, records, filters = {}, limit, recordKey = "records" }) => {
  const finalRecords = limit ? records.slice(0, limit) : records;
  return {
    dataset_id: dataset.dataset_id ?? dataset.identifier ?? dataset.name,
    total_records: sourceLength(dataset, recordKey) ?? records.length,
    matched_records: records.length,
    returned_records: finalRecords.length,
    filters,
    [recordKey]: finalRecords
  };
};

export const getDatasetsIndex = () => datasetCatalog();

export const getOntology = (args = {}) => {
  const records = arrayFrom(ontology, "entities").filter((record) =>
    equalsIfPresent(record, "category", args.category)
  );

  return resultSet({ dataset: ontology, records, filters: { category: args.category }, recordKey: "entities" });
};

export const getProtocols = (args = {}) => {
  const records = arrayFrom(protocols, "protocols").filter((record) =>
    equalsIfPresent(record, "protocol_id", args.protocol_id)
  );

  return resultSet({ dataset: protocols, records, filters: { protocol_id: args.protocol_id }, recordKey: "protocols" });
};

export const getPhysiologyAdaptation = (args = {}) => {
  if (!args.module) {
    return {
      dataset_id: "tg_physiology_adaptation_modules",
      note: "Pass a module slug to return module records. The parent physiology dataset is a shell and is not returned by this tool.",
      modules: PHYSIOLOGY_MODULES.map((module) => ({
        slug: module.slug,
        title: module.title,
        endpoint: `/datasets/physiology-adaptation/${module.slug}`
      }))
    };
  }

  const moduleData = MODULE_DATA[args.module];
  if (!moduleData) {
    throw new Error(`Unknown physiology module: ${args.module}`);
  }

  return moduleData;
};

export const getHrDriftAdaptation = () => hrDriftAdaptation;

export const getNutrition = (args = {}) => {
  const records = arrayFrom(nutrition, "records").filter((record) =>
    equalsIfPresent(record, "food_category", args.food_category) &&
    equalsIfPresent(record, "tg_fuel_class", args.tg_fuel_class)
  );

  return resultSet({
    dataset: nutrition,
    records,
    filters: { food_category: args.food_category, tg_fuel_class: args.tg_fuel_class },
    limit: boundedLimit(args.limit),
    recordKey: "records"
  });
};

export const getHydration = (args = {}) => {
  const records = arrayFrom(hydration).filter((record) => equalsIfPresent(record, "category", args.category));

  return resultSet({
    dataset: { dataset_id: "tg_electrolytes_dataset_v1" },
    records,
    filters: { category: args.category },
    limit: boundedLimit(args.limit),
    recordKey: "records"
  });
};

export const getPermits = (args = {}) => {
  const records = arrayFrom(permits, "records").filter((record) =>
    equalsIfPresent(record, "scarcity_tier", args.scarcity_tier)
  );

  return resultSet({ dataset: permits, records, filters: { scarcity_tier: args.scarcity_tier }, recordKey: "records" });
};

export const getTerrainAccessibleTrails = (args = {}) => {
  const records = arrayFrom(terrain, "hasPart").filter((record) =>
    equalsIfPresent(record, "region", args.region) &&
    equalsIfPresent(record, "accessibility_class", args.accessibility_class) &&
    equalsIfPresent(record, "protocol_level_estimate", args.protocol_level_estimate)
  );

  return resultSet({
    dataset: terrain,
    records,
    filters: {
      region: args.region,
      accessibility_class: args.accessibility_class,
      protocol_level_estimate: args.protocol_level_estimate
    },
    limit: boundedLimit(args.limit),
    recordKey: "hasPart"
  });
};

export const getEvidenceValidationSummits = (args = {}) => {
  const records = arrayFrom(evidence, "records").filter((record) => equalsIfPresent(record, "region", args.region));

  return resultSet({
    dataset: evidence,
    records,
    filters: { region: args.region },
    limit: boundedLimit(args.limit),
    recordKey: "records"
  });
};

export const getGearIntel = (args = {}) => {
  const records = arrayFrom(gear, "hasPart").filter((record) => equalsIfPresent(record, "category", args.category));

  return resultSet({
    dataset: gear,
    records,
    filters: { category: args.category },
    limit: boundedLimit(args.limit),
    recordKey: "hasPart"
  });
};

export const getGearIntelDataset = (args = {}) => {
  const category = args.category;

  if (!category) {
    return gear;
  }

  if (!GEAR_INTEL_CATEGORIES.includes(category)) {
    throw new Error(
      `Unknown category: ${category}. Valid categories: ${GEAR_INTEL_CATEGORIES.join(", ")}`
    );
  }

  const hasPart = arrayFrom(gear, "hasPart").filter((product) => product.category === category);

  return {
    ...gear,
    numberOfItems: hasPart.length,
    hasPart
  };
};

export const getLongevityProtocol = (args = {}) => {
  const records = arrayFrom(longevityProtocol, "protocols").filter((record) =>
    equalsIfPresent(record, "protocol_id", args.protocol_id) &&
    equalsIfPresent(record, "category", args.category)
  );

  return resultSet({
    dataset: longevityProtocol,
    records,
    filters: { protocol_id: args.protocol_id, category: args.category },
    recordKey: "protocols"
  });
};

export const getLongevityFoundationSessions = () => foundationSessions;

export const getWalkingConditioning = () => walkingConditioning;

export const getRuckingConditioning = () => ruckingConditioning;

export const getRunningConditioning = () => runningConditioning;

export const TOOL_HANDLERS = new Map([
  ["tg.datasets.index.get", getDatasetsIndex],
  ["tg.ontology.get", getOntology],
  ["tg.protocols.get", getProtocols],
  ["tg.physiology.adaptation.get", getPhysiologyAdaptation],
  ["tg.physiology.hrDriftAdaptation.get", getHrDriftAdaptation],
  ["tg.nutrition.get", getNutrition],
  ["tg.hydration.get", getHydration],
  ["tg.permits.dataset.get", getPermits],
  ["tg.terrain.accessibleTrails.get", getTerrainAccessibleTrails],
  ["tg.evidence.validationSummits.get", getEvidenceValidationSummits],
  ["tg.gear.intel.get", getGearIntel],
  ["tg.gear.getIntel", getGearIntelDataset],
  ["tg.longevity.protocol.get", getLongevityProtocol],
  ["tg.longevity.foundationSessions.get", getLongevityFoundationSessions],
  ["tg.conditioning.walking.get", getWalkingConditioning],
  ["tg.conditioning.rucking.get", getRuckingConditioning],
  ["tg.conditioning.running.get", getRunningConditioning],
  ["tg.longevity.bioAge.compute", computeTrailBioAge]
]);

export const datasetSourcePaths = () => {
  const paths = new Map();
  for (const dataset of DATASET_LIST) {
    if (!dataset.enabled) continue;
    paths.set(dataset.endpoint, dataset.source_path);
    for (const alias of dataset.aliases ?? []) {
      paths.set(alias, dataset.source_path);
    }
  }

  for (const module of PHYSIOLOGY_MODULES) {
    paths.set(`/datasets/physiology-adaptation/${module.slug}`, module.source_path);
  }

  return paths;
};

export const DATASET_JSON_BY_SOURCE_PATH = new Map([
  ["datasets/ontology/tg_ontology_v1.json", ontology],
  ["datasets/protocols/tg_protocol_kernel_v1.json", protocols],
  ["datasets/physiology_adaptation/tg_physiology_adaptation_v1.json", physiologyAdaptation],
  ["datasets/physiology_adaptation/hr_drift_adaptation_v1.json", hrDriftAdaptation],
  ["datasets/conditioning/tg_walking_conditioning_v1.json", walkingConditioning],
  ["datasets/conditioning/tg_rucking_conditioning_v1.json", ruckingConditioning],
  ["datasets/conditioning/tg_running_conditioning_v1.json", runningConditioning],
  ["datasets/nutrition/tg_nutrition_dataset_v1.json", nutrition],
  ["datasets/nutrition/tg_nutrition_schema_v1.json", nutritionSchema],
  ["datasets/hydration/tg_electrolytes_dataset_v1.json", hydration],
  ["datasets/permits/tg_permits_dataset_v1.json", permits],
  ["datasets/permits/tg_permits_schema_v1.json", permitsSchema],
  ["datasets/terrain_intelligence/tg_accessible_trails_top100_v1.json", terrain],
  ["datasets/evidence_validation/tg_validation_summits_v1.json", evidence],
  ["datasets/gear/gear-intel-dataset-q2-2026.json", gear],
  ["datasets/longevity/tg_longevity_protocol_v1.json", longevityProtocol],
  ["datasets/longevity/tg_longevity_registry_v1.json", longevityRegistry],
  ["datasets/longevity/tg_longevity_validation_v1.json", longevityValidation],
  ["datasets/longevity/tg_foundation_sessions_v1.json", foundationSessions],
  ...Object.entries(MODULE_DATA).map(([slug, data]) => [
    PHYSIOLOGY_MODULES.find((module) => module.slug === slug)?.source_path,
    data
  ]).filter(([sourcePath]) => Boolean(sourcePath))
]);
