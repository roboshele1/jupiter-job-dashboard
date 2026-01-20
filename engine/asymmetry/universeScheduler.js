/**
 * Universe Scheduler
 * --------------------------------------------------
 * Authoritative source of assets for asymmetry scans
 * Owns cadence + regime separation
 *
 * NOW SUPPORTS:
 * - PORTFOLIO / DISCOVERY (legacy-compatible)
 * - GLOBAL UNIVERSE (Moonshot mode)
 *
 * HARD RULES:
 * - No scan logic changes
 * - No scoring changes
 * - Universe selection only
 */

const autonomousMoonshotScanner = require("./autonomousMoonshotScanner");

// 🔵 GLOBAL UNIVERSE (Moonshot — unconstrained)
const {
  buildGlobalUniverse
} = require("../market/universe/globalUniverseAdapter");

// 🔵 TELEMETRY (read-only observer)
const {
  recordScanEvent
} = require("./telemetry/scanTelemetryBus");

// Internal cache
let cachedUniverse = [];
let lastBuiltAt = null;

/**
 * BUILD UNIVERSE (AUTHORITATIVE)
 * IPC-safe, read-only
 */
function buildUniverse() {
  return cachedUniverse;
}

/**
 * INTERNAL — refresh universe
 * DEFAULT: GLOBAL UNIVERSE (Moonshot)
 */
async function refreshUniverse() {
  const universe = await buildGlobalUniverse();
  cachedUniverse = universe;
  lastBuiltAt = new Date().toISOString();
  return universe;
}

/**
 * Runtime scheduler (engine-owned)
 */
function startScheduler() {
  console.log("[UniverseScheduler] MODE: GLOBAL (Moonshot)");
  console.log("[UniverseScheduler] PRIMARY scans every 60s");
  console.log("[UniverseScheduler] DEEP_ASYMMETRY scans every 300s");

  // Initial load
  refreshUniverse();

  // PRIMARY cadence
  setInterval(async () => {
    const universe = await refreshUniverse();
    const result = autonomousMoonshotScanner(universe);

    recordScanEvent({
      regime: "PRIMARY",
      universe,
      result
    });

    console.log(
      `[${new Date().toISOString()}] PRIMARY SCAN`,
      `Universe: ${universe.length}`,
      `Surfaced: ${result.surfacedCount}`
    );
  }, 60_000);

  // DEEP ASYMMETRY cadence
  setInterval(async () => {
    const universe = await refreshUniverse();
    const result = autonomousMoonshotScanner(universe);

    recordScanEvent({
      regime: "DEEP_ASYMMETRY",
      universe,
      result
    });

    console.log(
      `[${new Date().toISOString()}] DEEP ASYMMETRY SCAN`,
      `Universe: ${universe.length}`,
      `Surfaced: ${result.surfacedCount}`
    );
  }, 300_000);
}

module.exports = {
  startScheduler,
  buildUniverse
};
