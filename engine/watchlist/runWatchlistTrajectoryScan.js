// engine/watchlist/runWatchlistTrajectoryScan.js
// WATCHLIST TRAJECTORY — DEPENDENCY-SAFE AUTONOMY (V1)
// ---------------------------------------------------
// Purpose:
// - Surface WATCHLIST candidates with trajectory signals
// - Depends on discovery.ranked snapshot
//
// Guarantees:
// - NEVER throws if dependency missing
// - Skips safely until ranked snapshot exists
// - Deterministic, read-only, autonomous
// - Institutional-grade fault tolerance

import { readSnapshot } from "../runtime/runtimeStore.js";

export async function runWatchlistTrajectoryScan() {
  const rankedSnapshot = readSnapshot("discovery.ranked");

  // ─────────────────────────────────────────────
  // DEPENDENCY GUARD — SAFE SKIP (NO FAILURE)
  // ─────────────────────────────────────────────
  if (!rankedSnapshot || !Array.isArray(rankedSnapshot.ranked)) {
    return Object.freeze({
      contract: "WATCHLIST_TRAJECTORY_SNAPSHOT_V1",
      asOf: Date.now(),
      status: "DEFERRED",
      reason: "Awaiting discovery.ranked snapshot",
      sourceDependency: "discovery.ranked",
      evaluated: 0,
      watchlist: [],
    });
  }

  // ─────────────────────────────────────────────
  // FILTER: WATCHLIST BAND (MID-CONVICTION ONLY)
  // ─────────────────────────────────────────────
  const candidates = rankedSnapshot.ranked.filter(r => {
    const c = r.normalizedConviction;
    return typeof c === "number" && c >= 0.3 && c < 0.6;
  });

  // ─────────────────────────────────────────────
  // MAP → WATCHLIST TRAJECTORY VIEW
  // ─────────────────────────────────────────────
  const watchlist = candidates.map((r, idx) => ({
    watchId: `WL_TRAJ_${idx + 1}`,
    symbol: r.symbol,
    regime: r.regime,
    trajectory: r.trajectory || null,
    rationale:
      "Asset exhibits partial conviction with trajectory resemblance; suitable for monitoring, not action.",
  }));

  return Object.freeze({
    contract: "WATCHLIST_TRAJECTORY_SNAPSHOT_V1",
    asOf: Date.now(),
    status: "ACTIVE",
    sourceDependency: "discovery.ranked",
    evaluated: rankedSnapshot.ranked.length,
    watchlistCount: watchlist.length,
    watchlist,
  });
}

export default Object.freeze({
  runWatchlistTrajectoryScan,
});

