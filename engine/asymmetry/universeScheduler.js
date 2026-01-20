/**
 * Universe Scheduler
 * Authoritative source of assets for asymmetry scans
 * Owns cadence + regime separation
 */

const { getMarketUniverse } = require("../market/adapters/marketDataAdapter");
const autonomousMoonshotScanner = require("./autonomousMoonshotScanner");

// Internal cache
let cachedUniverse = [];
let lastBuiltAt = null;

/**
 * BUILD UNIVERSE (AUTHORITATIVE)
 * This is the ONLY function IPC is allowed to call
 */
function buildUniverse() {
  return cachedUniverse;
}

/**
 * INTERNAL — refresh universe from market adapter
 */
async function refreshUniverse() {
  const universe = await getMarketUniverse();
  cachedUniverse = universe;
  lastBuiltAt = new Date().toISOString();
  return universe;
}

/**
 * Runtime scheduler (used by engine loop only)
 */
function startScheduler() {
  console.log("[UniverseScheduler] Starting PRIMARY scans every 60s");
  console.log("[UniverseScheduler] Starting DEEP_ASYMMETRY scans every 300s");

  // Initial load
  refreshUniverse();

  // PRIMARY cadence
  setInterval(async () => {
    const universe = await refreshUniverse();
    const result = autonomousMoonshotScanner(universe);
    console.log(
      `[${new Date().toISOString()}] PRIMARY SCAN RESULT`,
      JSON.stringify(result, null, 2)
    );
  }, 60_000);

  // DEEP ASYMMETRY cadence
  setInterval(async () => {
    const universe = await refreshUniverse();
    const result = autonomousMoonshotScanner(universe);
    console.log(
      `[${new Date().toISOString()}] DEEP_ASYMMETRY SCAN RESULT`,
      JSON.stringify(result, null, 2)
    );
  }, 300_000);
}

module.exports = {
  startScheduler,
  buildUniverse
};
