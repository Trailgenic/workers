import { fetchAvailability } from "../workers/permit-poller/adapters.js";
import { PERMIT_PRODUCTS } from "../workers/permit-poller/catalog.js";

const today = new Date().toISOString().slice(0, 10);
const failures = [];

for (const product of PERMIT_PRODUCTS) {
  try {
    const result = await fetchAvailability(product, `${today.slice(0, 7)}-01`, [today]);
    console.log(JSON.stringify({
      permit_id: product.id,
      adapter: product.adapter,
      http_status: result.httpStatus,
      parsed_records: result.records.length,
      status: "ok"
    }));
  } catch (error) {
    failures.push(product.id);
    console.error(JSON.stringify({
      permit_id: product.id,
      adapter: product.adapter,
      status: "failed",
      code: error.code || "unexpected_error",
      http_status: error.httpStatus || null,
      message: error.message
    }));
  }
}

if (failures.length > 0) {
  throw new Error(`Permit source validation failed: ${failures.join(", ")}`);
}
