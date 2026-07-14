import { DATASET_LIST, PHYSIOLOGY_MODULES } from "./datasets.js";
import { DATASET_JSON_BY_SOURCE_PATH } from "./queries.js";

export const datasetResourceUri = (datasetId) => `trailgenic://datasets/${datasetId}`;
export const physiologyResourceUri = (slug) => `trailgenic://physiology/${slug}`;

export const resourceInventory = () => {
  const resources = [{
    uri: "trailgenic://datasets/index",
    name: "TrailGenic dataset index",
    title: "TrailGenic dataset index",
    description: "Generated public TrailGenic dataset catalog.",
    mimeType: "application/json"
  }];
  for (const dataset of DATASET_LIST.filter((entry) => entry.enabled)) {
    resources.push({
      uri: datasetResourceUri(dataset.id),
      name: dataset.id,
      title: dataset.id,
      description: dataset.description,
      mimeType: "application/json"
    });
  }
  for (const module of PHYSIOLOGY_MODULES) {
    resources.push({
      uri: physiologyResourceUri(module.slug),
      name: module.slug,
      title: module.title,
      description: `TrailGenic physiology module: ${module.title}.`,
      mimeType: "application/json"
    });
  }
  return resources;
};

export const readResource = (uri) => {
  if (uri === "trailgenic://datasets/index") return { dataset_catalog_version: "1.0", datasets: DATASET_LIST.filter((entry) => entry.enabled).map((entry) => ({ dataset_id: entry.id, dataset_family: entry.family, description: entry.description, endpoint: entry.endpoint, version: entry.version })) };
  const datasetPrefix = "trailgenic://datasets/";
  if (uri.startsWith(datasetPrefix)) {
    const id = uri.slice(datasetPrefix.length);
    const dataset = DATASET_LIST.find((entry) => entry.enabled && entry.id === id);
    if (!dataset) return undefined;
    return DATASET_JSON_BY_SOURCE_PATH.get(dataset.source_path);
  }
  const physiologyPrefix = "trailgenic://physiology/";
  if (uri.startsWith(physiologyPrefix)) {
    const slug = uri.slice(physiologyPrefix.length);
    const module = PHYSIOLOGY_MODULES.find((entry) => entry.slug === slug);
    if (!module) return undefined;
    return DATASET_JSON_BY_SOURCE_PATH.get(module.source_path);
  }
  return undefined;
};
