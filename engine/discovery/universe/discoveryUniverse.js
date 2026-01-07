/**
 * D7.5 — Discovery Universe Definition
 * -----------------------------------
 * Canonical, deterministic universe for Discovery scanning.
 * No intelligence. No ranking. No mutation.
 */

const DISCOVERY_UNIVERSE = Object.freeze([
  { symbol: "NVDA", ownership: true },
  { symbol: "SMCI", ownership: false },
  { symbol: "COIN", ownership: false },
  { symbol: "URA", ownership: false },
  { symbol: "ARM", ownership: false },
  { symbol: "NEE", ownership: false },
  { symbol: "ETH", ownership: false },
]);

function getDiscoveryUniverse() {
  return DISCOVERY_UNIVERSE;
}

module.exports = Object.freeze({
  getDiscoveryUniverse,
});
