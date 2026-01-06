/**
 * normalizeMetrics.js
 * --------------------------------------------------
 * D1.1 — Metric Normalization Layer (Canonical)
 *
 * Purpose:
 * - Normalize heterogeneous raw metrics into a 0–1 range
 * - Enforce read-only behavior
 * - Deterministic by construction
 *
 * Guarantees:
 * - No mutation of input object
 * - Same input → same output
 * - No time, randomness, or external state
 */

function clamp(value, min = 0, max = 1) {
  return Math.min(Math.max(value, min), max);
}

function normalizeMetrics(rawMetrics = {}) {
  // Defensive copy to guarantee immutability
  const input = Object.freeze({ ...rawMetrics });

  const normalized = {};

  // Growth metrics (higher is better)
  if (typeof input.revenueGrowth === "number") {
    normalized.revenueGrowth = clamp(input.revenueGrowth / 0.40); // 40% = top-tier
  }

  if (typeof input.epsGrowth === "number") {
    normalized.epsGrowth = clamp(input.epsGrowth / 0.40);
  }

  // Profitability / efficiency
  if (typeof input.roe === "number") {
    normalized.roe = clamp(input.roe / 0.35); // 35% ROE ≈ elite
  }

  if (typeof input.roic === "number") {
    normalized.roic = clamp(input.roic / 0.30);
  }

  if (typeof input.fcfMargin === "number") {
    normalized.fcfMargin = clamp(input.fcfMargin / 0.30);
  }

  // Balance sheet risk (lower is better → inverted)
  if (typeof input.debtRatio === "number") {
    normalized.debtRatio = clamp(1 - input.debtRatio);
  }

  if (typeof input.netDebtToEbitda === "number") {
    normalized.netDebtToEbitda = clamp(1 - input.netDebtToEbitda / 4);
  }

  // Market / momentum context (non-trading)
  if (typeof input.priceMomentum === "number") {
    normalized.priceMomentum = clamp(input.priceMomentum);
  }

  // Freeze output to guarantee downstream safety
  return Object.freeze(normalized);
}

/* ==================================================
   EXPORT CONTRACT — REQUIRED FOR TERMINAL TESTS
================================================== */
module.exports = {
  normalizeMetrics,
};
