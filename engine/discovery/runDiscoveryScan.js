/**
 * DISCOVERY LAB — AUTONOMOUS SCAN (D13.3)
 * -------------------------------------
 * - Universe normalization
 * - Per-asset Discovery evaluation
 * - Canonical ranking
 * - Multi-regime comparative ranking
 * - Regime delta analysis
 *
 * CONTRACT:
 * - Universe entries may be strings OR objects { symbol, tags }
 * - Discovery engine always receives a string symbol
 * - Tags are preserved on the result (descriptive only)
 */

const { buildDiscoveryUniverse } = require("./universe/buildDiscoveryUniverse.js");
const { runDiscoveryEngine } = require("./discoveryEngine.js");
const { rankDiscoveryResults } = require("./ranking/rankDiscoveryResults.js");
const {
  compareRegimeRankings,
} = require("./ranking/compareRegimeRankings.js");
const {
  analyzeRegimeDeltas,
} = require("./ranking/regimeDeltaAnalysis.js");

async function runDiscoveryScan() {
  const rawUniverse = await buildDiscoveryUniverse();

  // ---- NORMALIZE UNIVERSE ----
  const universe = rawUniverse
    .map((u) => {
      if (typeof u === "string") {
        return { symbol: u, tags: [] };
      }
      if (u && typeof u.symbol === "string") {
        return { symbol: u.symbol, tags: u.tags || [] };
      }
      return null;
    })
    .filter(Boolean);

  const evaluated = [];

  for (const asset of universe) {
    const result = await runDiscoveryEngine({
      symbol: asset.symbol,
      ownership: false,
    });

    evaluated.push(
      Object.freeze({
        ...result,
        tags: asset.tags, // descriptive only
      })
    );
  }

  const canonical = rankDiscoveryResults(evaluated);
  const comparativeByRegime = compareRegimeRankings(evaluated);
  const deltas = analyzeRegimeDeltas({ canonical, comparativeByRegime });

  return Object.freeze({
    canonical,
    comparativeByRegime,
    regimeDeltas: deltas,
  });
}

module.exports = Object.freeze({
  runDiscoveryScan,
});
