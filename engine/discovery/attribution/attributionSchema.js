/**
 * DISCOVERY LAB — FACTOR ATTRIBUTION SCHEMA (D4.1)
 * ------------------------------------------------
 * Purpose:
 * - Define canonical attribution factors
 * - Enforce deterministic percentage math
 * - Guarantee explainability + auditability
 *
 * Rules:
 * - Factors must sum to 100%
 * - No hidden or dynamic factors
 * - Attribution does NOT change scores — it explains them
 * - Read-only, pure function
 */

const FACTORS = Object.freeze([
  "growth",
  "quality",
  "risk",
  "momentum",
]);

function validateFactors(input) {
  const keys = Object.keys(input);

  for (const key of keys) {
    if (!FACTORS.includes(key)) {
      throw new Error(`INVALID_FACTOR: ${key}`);
    }
  }

  for (const factor of FACTORS) {
    if (typeof input[factor] !== "number") {
      throw new Error(`MISSING_FACTOR_VALUE: ${factor}`);
    }
    if (input[factor] < 0) {
      throw new Error(`NEGATIVE_FACTOR_VALUE: ${factor}`);
    }
  }
}

function normalizeAttribution(raw) {
  validateFactors(raw);

  const total =
    raw.growth +
    raw.quality +
    raw.risk +
    raw.momentum;

  if (total <= 0) {
    throw new Error("INVALID_ATTRIBUTION_TOTAL");
  }

  const normalized = {};
  let runningSum = 0;

  for (let i = 0; i < FACTORS.length; i++) {
    const f = FACTORS[i];

    if (i === FACTORS.length - 1) {
      normalized[f] = 100 - runningSum;
    } else {
      const pct = Math.round((raw[f] / total) * 100);
      normalized[f] = pct;
      runningSum += pct;
    }
  }

  return Object.freeze(normalized);
}

module.exports = Object.freeze({
  FACTORS,
  normalizeAttribution,
});
