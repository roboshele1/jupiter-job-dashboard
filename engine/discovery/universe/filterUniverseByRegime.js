/**
 * D7.7 — Regime-Aware Universe Filtering
 * ------------------------------------
 * Purpose:
 * Reduce / expand the discovery universe deterministically
 * based on macro regime — BEFORE scoring.
 *
 * Rules:
 * - Engine-only
 * - Read-only
 * - Deterministic
 * - No scoring logic here
 */

const REGIME_RULES = Object.freeze({
  TIGHT_MONETARY: Object.freeze({
    excludeTags: ["high_beta", "high_leverage", "speculative"],
  }),

  RISK_ON_GROWTH: Object.freeze({
    includeBias: ["growth", "momentum"],
  }),

  INFLATIONARY_EXPANSION: Object.freeze({
    includeBias: ["pricing_power", "real_assets"],
  }),

  RISK_OFF_DEFENSIVE: Object.freeze({
    includeBias: ["defensive", "cash_flow"],
  }),
});

function filterUniverseByRegime({ universe, regime }) {
  if (!Array.isArray(universe)) {
    throw new Error("INVALID_INPUT: universe must be an array");
  }

  if (!regime || !REGIME_RULES[regime]) {
    // Unknown regime → no filtering
    return universe.slice();
  }

  const rules = REGIME_RULES[regime];

  // Exclusion pass
  let filtered = universe.slice();
  if (rules.excludeTags) {
    filtered = filtered.filter(u => {
      const tags = u.tags || [];
      return !rules.excludeTags.some(t => tags.includes(t));
    });
  }

  // Inclusion bias does NOT exclude — it only orders later
  return filtered;
}

module.exports = Object.freeze({
  filterUniverseByRegime,
});
