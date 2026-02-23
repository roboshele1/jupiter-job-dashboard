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
let cachedScanResult = null;
let lastScannedAt = null;

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

  // Initial load — run scan immediately so cache is hot on first IPC call
  refreshUniverse().then(async universe => {
    try {
      const result = await autonomousMoonshotScanner(universe);
      cachedScanResult = result;
      lastScannedAt = new Date().toISOString();
      recordScanEvent({ regime: "INITIAL", universe, result });
      console.log(`[UniverseScheduler] INITIAL SCAN complete — Surfaced: ${result.surfacedCount}`);
    } catch (err) {
      console.error("[UniverseScheduler] INITIAL SCAN failed:", err.message);
    }
  });

  // PRIMARY cadence
  setInterval(async () => {
    const universe = await refreshUniverse();
    const result = await autonomousMoonshotScanner(universe);
    cachedScanResult = result;
    lastScannedAt = new Date().toISOString();

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
    const result = await autonomousMoonshotScanner(universe);
    cachedScanResult = result;
    lastScannedAt = new Date().toISOString();

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

/**
 * GET CACHED SCAN RESULT (IPC-safe, read-only)
 * Returns the last result from autonomousMoonshotScanner, or null if cold.
 */
function getCachedScanResult() {
  return cachedScanResult;
}

/**
 * GET CACHE META
 */
function getCacheMeta() {
  return {
    lastBuiltAt,
    lastScannedAt,
    universeSize: cachedUniverse.length,
    hasScanResult: cachedScanResult !== null,
  };
}

module.exports = {
  startScheduler,
  buildUniverse,
  getCachedScanResult,
  getCacheMeta,
};
