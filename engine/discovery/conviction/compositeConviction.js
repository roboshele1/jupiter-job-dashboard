/**
 * DISCOVERY LAB — COMPOSITE CONVICTION ENGINE (D1.4 + D4.2)
 * -------------------------------------------------------
 * Purpose:
 * - Combine fundamental, tactical, and risk signals
 * - Produce a normalized conviction score (0–1)
 * - Attach deterministic factor attribution (D4.1)
 *
 * Rules:
 * - No randomness
 * - No portfolio mutation
 * - Attribution explains outcome, does NOT influence math
 */

const { normalizeAttribution } = require(
  "../attribution/attributionSchema.js"
);

function clamp(v, min = 0, max = 1) {
  return Math.max(min, Math.min(max, v));
}

function computeCompositeConviction(input) {
  const {
    fundamentalScore, // 0–10
    tacticalScore,    // 0–1
    riskPenalty,      // 0–1 (higher = worse)
  } = input;

  if (
    typeof fundamentalScore !== "number" ||
    typeof tacticalScore !== "number" ||
    typeof riskPenalty !== "number"
  ) {
    throw new Error("INVALID_INPUT: composite conviction inputs");
  }

  // Normalize fundamentals to 0–1
  const f = clamp(fundamentalScore / 10);
  const t = clamp(tacticalScore);
  const r = clamp(1 - riskPenalty);

  // Canonical weights (LOCKED)
  const WEIGHTS = Object.freeze({
    growth: 0.40,
    quality: 0.20,
    momentum: 0.25,
    risk: 0.15,
  });

  const raw =
    f * (WEIGHTS.growth + WEIGHTS.quality) +
    t * WEIGHTS.momentum +
    r * WEIGHTS.risk;

  const normalized = clamp(raw);

  // Attribution math (D4.1)
  const attribution = normalizeAttribution({
    growth: f * WEIGHTS.growth,
    quality: f * WEIGHTS.quality,
    momentum: t * WEIGHTS.momentum,
    risk: r * WEIGHTS.risk,
  });

  return Object.freeze({
    score: Math.round(normalized * 10),
    normalized: Math.round(normalized * 100) / 100,
    attribution,
    summary:
      normalized >= 0.8
        ? "Overall conviction is high, driven primarily by business strength and supportive conditions."
        : normalized >= 0.6
        ? "Overall conviction is mixed, with positives balanced by risks or uncertainty."
        : "Overall conviction is weak due to limited strengths or elevated risk.",
  });
}

module.exports = Object.freeze({
  computeCompositeConviction,
});
