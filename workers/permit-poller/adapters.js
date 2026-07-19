const BROWSER_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export class SourceResponseError extends Error {
  constructor(message, { code = "source_error", httpStatus = null } = {}) {
    super(message);
    this.name = "SourceResponseError";
    this.code = code;
    this.httpStatus = httpStatus;
  }
}

export const monthBounds = (dateString) => {
  if (!DATE_RE.test(dateString)) throw new TypeError(`Invalid date: ${dateString}`);
  const [year, month] = dateString.split("-").map(Number);
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 0));
  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
    startISO: start.toISOString()
  };
};

export const buildAvailabilityUrl = (product, monthDate) => {
  const { startDate, endDate, startISO } = monthBounds(monthDate);
  if (product.adapter === "recreation_inyo") {
    return `https://www.recreation.gov/api/permitinyo/${product.facility_id}/availabilityv2?start_date=${startDate}&end_date=${endDate}&commercial_acct=false`;
  }
  if (product.adapter === "recreation_division_month") {
    return `https://www.recreation.gov/api/permits/${product.facility_id}/availability/month?start_date=${encodeURIComponent(startISO)}`;
  }
  throw new SourceResponseError(`Unsupported adapter: ${product.adapter}`, { code: "unsupported_adapter" });
};

const ensurePayloadObject = (response) => {
  if (!response || typeof response !== "object" || !response.payload || typeof response.payload !== "object" || Array.isArray(response.payload)) {
    throw new SourceResponseError("Availability payload is missing or malformed", { code: "invalid_schema" });
  }
  return response.payload;
};

const normalizeRemaining = (value, context) => {
  if (!Number.isInteger(value) || value < 0) {
    throw new SourceResponseError(`Invalid remaining count at ${context}`, { code: "invalid_schema" });
  }
  return value;
};

export const parseInyoAvailability = (response, product, requestedDates) => {
  const payload = ensurePayloadObject(response);
  const records = [];
  for (const date of requestedDates) {
    const day = payload[date];
    // A missing day is unknown/unreleased, not proof of zero inventory.
    if (!day || typeof day !== "object" || Array.isArray(day)) continue;
    const division = day[product.division_id];
    if (!division) {
      // When the provider returned the day but omitted this division, it has no inventory.
      records.push({ date, remaining: 0 });
      continue;
    }
    const remaining = division?.quota_usage_by_member_daily?.remaining;
    records.push({
      date,
      remaining: normalizeRemaining(remaining, `${date}.${product.division_id}.quota_usage_by_member_daily.remaining`)
    });
  }
  return records;
};

export const parseDivisionMonthAvailability = (response, product, requestedDates) => {
  const payload = ensurePayloadObject(response);
  const availability = payload.availability;
  if (!availability || typeof availability !== "object" || Array.isArray(availability)) {
    throw new SourceResponseError("Division availability map is missing or malformed", { code: "invalid_schema" });
  }
  const division = availability[product.division_id];
  if (!division || typeof division !== "object" || Array.isArray(division)) {
    throw new SourceResponseError(`Expected division ${product.division_id} is missing`, { code: "division_missing" });
  }
  const dateAvailability = division.date_availability;
  if (!dateAvailability || typeof dateAvailability !== "object" || Array.isArray(dateAvailability)) {
    throw new SourceResponseError(`Date availability for division ${product.division_id} is missing`, { code: "invalid_schema" });
  }
  const records = [];
  for (const date of requestedDates) {
    const slot = dateAvailability[`${date}T00:00:00Z`] || dateAvailability[date];
    // Missing dates remain unknown so parser/source changes cannot create false transitions.
    if (!slot || typeof slot !== "object") continue;
    records.push({
      date,
      remaining: normalizeRemaining(slot.remaining, `${product.division_id}.${date}.remaining`)
    });
  }
  return records;
};

export const parseAvailability = (response, product, requestedDates) => {
  if (product.adapter === "recreation_inyo") {
    return parseInyoAvailability(response, product, requestedDates);
  }
  if (product.adapter === "recreation_division_month") {
    return parseDivisionMonthAvailability(response, product, requestedDates);
  }
  throw new SourceResponseError(`Unsupported adapter: ${product.adapter}`, { code: "unsupported_adapter" });
};

export const fetchAvailability = async (product, monthDate, requestedDates, fetchImpl = fetch) => {
  const url = buildAvailabilityUrl(product, monthDate);
  let response;
  try {
    response = await fetchImpl(url, {
      headers: { Accept: "application/json", "User-Agent": BROWSER_UA },
      signal: AbortSignal.timeout(15_000)
    });
  } catch (error) {
    throw new SourceResponseError(`Availability request failed: ${error.message}`, { code: "network_error" });
  }
  if (!response.ok) {
    throw new SourceResponseError(`Recreation.gov returned ${response.status}`, {
      code: response.status === 429 ? "rate_limited" : "http_error",
      httpStatus: response.status
    });
  }
  let body;
  try {
    body = await response.json();
  } catch {
    throw new SourceResponseError("Availability response was not valid JSON", { code: "invalid_json", httpStatus: response.status });
  }
  return {
    url,
    httpStatus: response.status,
    records: parseAvailability(body, product, requestedDates)
  };
};
