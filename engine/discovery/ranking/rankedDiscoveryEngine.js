/**
 * RANKED DISCOVERY ENGINE — AUTONOMOUS SCANNER (V1)
 * ------------------------------------------------
 * Iterates the authoritative discovery universe,
 * evaluates each symbol via the Discovery Engine
 * (single-symbol orchestrator), ranks candidates,
 * and emits a frozen snapshot.
 *
 * - Read-only
 * - Deterministic
 * - No IPC / UI / storage
 * - Runtime-safe
 */

const {
  buildDiscoveryUniverse,
} = require("../universe/buildDiscoveryUniverse.js");

const {
  runDiscoveryEngine,
} = require("../discoveryEngine.js");

/**
 * CONFIG (internal, non-mutable)
 */
const MAX_CANDIDATES = 30;
const MIN_CONVICTION = 0.35;

/**
 * ENTRY POINT — AUTONOMOUS RANKED DISCOVERY
 */
async function runRankedDiscoveryEngine() {
  const asOf = Date.now();

  // 1. Resolve authoritative universe (live → relaxed → fallback)
  const universeSnapshot = await buildDiscoveryUniverse();

  const universe = Array.isArray(universeSnapshot?.universe)
    ? universeSnapshot.universe
    : [];

  if (universe.length === 0) {
    throw new Error("DISCOVERY_UNIVERSE_EMPTY");
  }

  const results = [];
  let evaluated = 0;

  // 2. Evaluate each symbol independently
  for (const asset of universe) {
    const symbol = asset.symbol;

    try {
      const out = await runDiscoveryEngine({
        symbol,
        ownership: false,
      });

      evaluated++;

      if (!out || !out.conviction) continue;
      if (out.conviction.normalized < MIN_CONVICTION) continue;

      results.push({
        symbol,
        convictionScore: out.conviction.score,
        normalizedConviction: out.conviction.normalized,
        decision: out.decision?.label || "UNSPECIFIED",
        regime: out.regime?.label || "UNKNOWN",
        trajectory: out.trajectoryMatch
          ? {
              label: out.trajectoryMatch.label,
              confidence: out.trajectoryMatch.confidence,
            }
          : null,
      });
    } catch {
      // Failure-isolated: skip symbol, continue scan
      continue;
    }
  }

  // 3. Rank candidates by conviction
  results.sort((a, b) => b.convictionScore - a.convictionScore);

  const ranked = results.slice(0, MAX_CANDIDATES);

  // 4. Emit frozen snapshot
  return Object.freeze({
    contract: "DISCOVERY_RANKED_SNAPSHOT_V1",
    asOf,
    universeMode: universeSnapshot.mode,
    universeSize: universe.length,
    evaluated,
    ranked,
    telemetry: universeSnapshot.telemetry,
  });
}

module.exports = Object.freeze({
  runRankedDiscoveryEngine,
});

