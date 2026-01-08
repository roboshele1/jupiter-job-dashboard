/**
 * D14.3 — Controlled Fallback Discovery Universe
 * ----------------------------------------------
 * PURPOSE:
 * - Preserve LIVE universe as authoritative
 * - Activate FALLBACK universe ONLY when live snapshot is empty
 * - Maintain determinism, caps, and auditability
 *
 * IMPORTANT:
 * - Fallback is explicit and labeled
 * - No silent loosening
 * - No execution, no prediction
 */

const {
  getLiveMarketSnapshot,
} = require("../../market/live/liveMarketSnapshotService.js");

const HARD_CAP = 60;
const STRICT_VOLUME_FLOOR = 1_000_000;
const RELAXED_VOLUME_FLOOR = 500_000;

/**
 * Explicit fallback universe (deterministic, institutional)
 * Used ONLY when live snapshot yields zero assets
 */
const FALLBACK_UNIVERSE = Object.freeze([
  { symbol: "AAPL", tags: ["mega_cap", "quality"] },
  { symbol: "MSFT", tags: ["mega_cap", "quality"] },
  { symbol: "NVDA", tags: ["mega_cap", "growth", "high_beta"] },
  { symbol: "AMZN", tags: ["mega_cap", "growth"] },
  { symbol: "GOOGL", tags: ["mega_cap", "quality"] },
  { symbol: "META", tags: ["mega_cap", "growth"] },
  { symbol: "AVGO", tags: ["mega_cap", "quality"] },
  { symbol: "ASML", tags: ["mega_cap", "quality"] },
]);

async function buildDiscoveryUniverse() {
  const snapshot = await getLiveMarketSnapshot({
    scope: "DISCOVERY_UNIVERSE",
  });

  const data = snapshot?.data || [];

  let universe = [];
  let mode = "STRICT";
  let notes = [];

  // ---------- PASS 1: STRICT LIVE ----------
  universe = filterAndBuild({
    data,
    volumeFloor: STRICT_VOLUME_FLOOR,
  });

  notes.push(`Strict pass: volume >= ${STRICT_VOLUME_FLOOR}`);

  // ---------- PASS 2: RELAXED LIVE ----------
  if (universe.length === 0 && data.length > 0) {
    universe = filterAndBuild({
      data,
      volumeFloor: RELAXED_VOLUME_FLOOR,
    });

    mode = "RELAXED_ON_EMPTY";
    notes.push(`Relaxed pass: volume >= ${RELAXED_VOLUME_FLOOR}`);
  }

  // ---------- PASS 3: EXPLICIT FALLBACK ----------
  if (universe.length === 0) {
    universe = FALLBACK_UNIVERSE.slice(0, HARD_CAP);
    mode = "FALLBACK_UNIVERSE";
    notes.push(
      "Live market snapshot empty. Activated explicit fallback universe."
    );
  }

  universe = universe.slice(0, HARD_CAP);

  return Object.freeze({
    mode,
    universe: Object.freeze(universe),
    telemetry: Object.freeze({
      rawSnapshotCount: data.length,
      universeCount: universe.length,
      volumeFloorUsed:
        mode === "STRICT"
          ? STRICT_VOLUME_FLOOR
          : mode === "RELAXED_ON_EMPTY"
          ? RELAXED_VOLUME_FLOOR
          : null,
      notes,
    }),
  });
}

function filterAndBuild({ data, volumeFloor }) {
  return data
    .filter(
      (a) =>
        a &&
        typeof a.symbol === "string" &&
        a.volume &&
        a.price &&
        a.volume >= volumeFloor
    )
    .sort((a, b) => {
      if (b.volume !== a.volume) return b.volume - a.volume;
      return a.symbol.localeCompare(b.symbol);
    })
    .map((a) => ({
      symbol: a.symbol,
      tags: deriveTags(a),
    }));
}

function deriveTags(asset) {
  const tags = [];

  if (asset.marketCap) {
    if (asset.marketCap > 200_000_000_000) tags.push("mega_cap");
    else if (asset.marketCap > 10_000_000_000) tags.push("large_cap");
    else tags.push("mid_small_cap");
  }

  if (asset.volatility) {
    tags.push(asset.volatility > 0.05 ? "high_beta" : "low_beta");
  }

  if (asset.assetClass) {
    tags.push(asset.assetClass);
  }

  return Object.freeze(tags);
}

module.exports = Object.freeze({
  buildDiscoveryUniverse,
});
