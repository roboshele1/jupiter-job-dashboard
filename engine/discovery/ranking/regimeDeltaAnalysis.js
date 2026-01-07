/**
 * D7.10 — Regime Delta Analysis
 * ----------------------------
 * Purpose:
 * Explain WHY asset rankings change across regimes by
 * quantifying factor-level deltas (growth, quality, risk, momentum).
 *
 * Guarantees:
 * - Read-only
 * - Deterministic
 * - Engine-only
 * - No score mutation
 */

function computeRankIndexMap(rankedList) {
  const map = {};
  rankedList.forEach((r, idx) => {
    map[r.symbol] = idx + 1; // 1-based rank
  });
  return map;
}

function diffFactors(base, other) {
  const out = {};
  const keys = new Set([
    ...Object.keys(base || {}),
    ...Object.keys(other || {}),
  ]);

  keys.forEach(k => {
    const a = base?.[k] ?? 0;
    const b = other?.[k] ?? 0;
    out[k] = +(b - a).toFixed(4);
  });

  return Object.freeze(out);
}

/**
 * Input:
 * {
 *   canonical: [ranked results],
 *   comparativeByRegime: {
 *     REGIME: [ranked results]
 *   }
 * }
 */
function analyzeRegimeDeltas(input) {
  if (!input || typeof input !== "object") {
    throw new Error("INVALID_INPUT: delta analysis requires object");
  }

  const { canonical, comparativeByRegime } = input;

  if (!Array.isArray(canonical) || typeof comparativeByRegime !== "object") {
    throw new Error("INVALID_INPUT: malformed delta analysis input");
  }

  const canonicalRanks = computeRankIndexMap(canonical);
  const deltas = {};

  for (const [regime, ranked] of Object.entries(comparativeByRegime)) {
    const regimeRanks = computeRankIndexMap(ranked);

    deltas[regime] = ranked.map(r => {
      const baseRank = canonicalRanks[r.symbol];
      const regimeRank = regimeRanks[r.symbol];

      return Object.freeze({
        symbol: r.symbol,
        rankChange: baseRank - regimeRank, // positive = moved up
        factorDelta: diffFactors(
          canonical.find(x => x.symbol === r.symbol)?.factorAttribution,
          r.factorAttribution
        ),
        summary:
          baseRank === regimeRank
            ? "Rank unchanged under this regime."
            : baseRank > regimeRank
            ? "Asset benefits from this regime due to factor reweighting."
            : "Asset is penalized under this regime due to factor reweighting.",
      });
    });
  }

  return Object.freeze(deltas);
}

module.exports = Object.freeze({
  analyzeRegimeDeltas,
});
