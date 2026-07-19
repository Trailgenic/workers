export const PERMIT_PRODUCTS = Object.freeze([
  Object.freeze({
    id: "rec_gov_445860_day_use",
    name: "Mt. Whitney Day Use",
    provider: "recreation.gov",
    adapter: "recreation_inyo",
    facility_id: "445860",
    division_id: "406",
    division_name: "Mt. Whitney Day Use (All Routes)",
    booking_url: "https://www.recreation.gov/permits/445860",
    max_party_size: 15
  }),
  Object.freeze({
    id: "rec_gov_445860_overnight",
    name: "Mt. Whitney Overnight",
    provider: "recreation.gov",
    adapter: "recreation_inyo",
    facility_id: "445860",
    division_id: "166",
    division_name: "Mt. Whitney Trail (Overnight)",
    booking_url: "https://www.recreation.gov/permits/445860",
    max_party_size: 15
  }),
  Object.freeze({
    id: "rec_gov_234652_daily",
    name: "Half Dome Daily Permit",
    provider: "recreation.gov",
    adapter: "recreation_division_month",
    facility_id: "234652",
    division_id: "31",
    division_name: "Half Dome Cables (Daily)",
    booking_url: "https://www.recreation.gov/permits/234652",
    max_party_size: 6
  })
]);

const PRODUCT_BY_ID = new Map(PERMIT_PRODUCTS.map((product) => [product.id, product]));

export const getPermitProduct = (permitId) => PRODUCT_BY_ID.get(permitId) || null;

export const publicPermitCatalog = () => PERMIT_PRODUCTS.map((product) => ({
  id: product.id,
  name: product.name,
  division_name: product.division_name,
  booking_url: product.booking_url,
  max_party_size: product.max_party_size
}));
