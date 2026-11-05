export const PERMIT_PRODUCTS = Object.freeze([
  Object.freeze({
    id: "rec_gov_445860_day_use",
    name: "Mt. Whitney Day Use",
    place: "Mt. Whitney",
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
    place: "Mt. Whitney",
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
    place: "Half Dome",
    provider: "recreation.gov",
    adapter: "recreation_division_month",
    facility_id: "234652",
    division_id: "31",
    division_name: "Half Dome Cables (Daily)",
    booking_url: "https://www.recreation.gov/permits/234652",
    max_party_size: 6
  }),
  Object.freeze({
    id: "rec_gov_445864_overnight",
    name: "King Range Wilderness (Lost Coast)",
    place: "Lost Coast",
    provider: "recreation.gov",
    adapter: "recreation_inyo",
    facility_id: "445864",
    division_id: "445864001",
    division_name: "King Range Wilderness",
    booking_url: "https://www.recreation.gov/permits/445864",
    max_party_size: 3,
    safety_notice: "Lost Coast dates can be impassable. Check tides, marine forecast, and weather before booking."
  }),
  Object.freeze({
    // Verified Nov 5, 2026: availability/month returns division 999 with per-climber remaining counts.
    id: "rec_gov_4675309_climbing",
    name: "Mt. St. Helens Climbing Permit",
    place: "Mt. St. Helens",
    provider: "recreation.gov",
    adapter: "recreation_division_month",
    facility_id: "4675309",
    division_id: "999",
    division_name: "Mt. St. Helens",
    booking_url: "https://www.recreation.gov/permits/4675309",
    max_party_size: 12
  }),
  Object.freeze({
    // Verified Nov 5, 2026: division 30 is the Core Enchantment Zone. People left come from
    // quota_type_maps.QuotaUsageByMember; group permits from ConstantQuotaUsageByStartDate.
    id: "rec_gov_233273_core",
    name: "Enchantments Core Zone (Overnight)",
    place: "Enchantments",
    provider: "recreation.gov",
    adapter: "recreation_division_month",
    quota_unit: "group",
    facility_id: "233273",
    division_id: "30",
    division_name: "Core Enchantment Zone",
    booking_url: "https://www.recreation.gov/permits/233273",
    max_party_size: 8
  }),
  Object.freeze({
    // Verified Nov 5, 2026: permitinyo availabilityv2 returns entry point 44585917 with
    // quota_usage_by_member_daily.remaining. This trailhead quota is eligible for Half Dome.
    id: "rec_gov_445859_happy_isles_lyv",
    name: "Yosemite Wilderness: Happy Isles to Little Yosemite Valley (Half Dome overnight)",
    place: "Half Dome",
    provider: "recreation.gov",
    adapter: "recreation_inyo",
    facility_id: "445859",
    division_id: "44585917",
    division_name: "Happy Isles->Little Yosemite Valley (No Donohue Pass)",
    booking_url: "https://www.recreation.gov/permits/445859",
    max_party_size: 15
  })
]);

const PRODUCT_BY_ID = new Map(PERMIT_PRODUCTS.map((product) => [product.id, product]));

export const getPermitProduct = (permitId) => PRODUCT_BY_ID.get(permitId) || null;

export const publicPermitCatalog = () => PERMIT_PRODUCTS.map((product) => ({
  id: product.id,
  name: product.name,
  place: product.place || product.name,
  division_name: product.division_name,
  booking_url: product.booking_url,
  max_party_size: product.max_party_size,
  safety_notice: product.safety_notice || null
}));
