/**
 * D7.9 — Multi-Regime Comparative Ranking Engine
 * ----------------------------------------------
 * Purpose:
 * Produce deterministic rankings of the SAME discovery results
 * across ALL supported economic regimes.
 *
 * Guarantees:
 * - No score mutation
 * - No decision mutation
 * - No explanation mutation
 * - Engine-only
 */

const { rankDiscoveryResults } = require("./rankDiscoveryResults.js");

const SUPPORTED_REGIMES = Object.freeze([
  "RISK_ON_GROWTH",
  "INFLATIONARY_EXPANSION",
  "TIGHT_MONETARY",
  "RISK_OFF_DEFENSIVE",
]);

function applyRegimeOverride(result, regimeLabel) {
  return Object.freeze({
    ...result,
    regime: Object.freeze({
      ...result.regime,
      label: regimeLabel,
    }),
  });
}

function compareRegimeRankings(discoveryResults) {
  if (!Array.isArray(discoveryResults)) {
    throw new Error("INVALID_INPUT: expected array of discovery results");
  }

  const output = {};

  for (const regime of SUPPORTED_REGIMES) {
    const regimeView = discoveryResults.map(r =>
      applyRegimeOverride(r, regime)
    );

    output[regime] = rankDiscoveryResults(regimeView);
  }

  return Object.freeze(output);
}

module.exports = Object.freeze({
  compareRegimeRankings,
  SUPPORTED_REGIMES,
});
