/**
 * DISCOVERY LAB — AUTONOMOUS SCAN (D7.5 → D7.10)
 * --------------------------------------------
 * - Universe build
 * - Per-asset Discovery evaluation
 * - Canonical ranking
 * - Multi-regime comparative ranking
 * - Regime delta analysis (why ranks shift)
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
  const universe = await buildDiscoveryUniverse();

  const evaluated = [];
  for (const symbol of universe) {
    const result = await runDiscoveryEngine({
      symbol,
      ownership: false,
    });
    evaluated.push(result);
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
