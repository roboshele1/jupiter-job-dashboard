/**
 * liveSnapshotServer.js
 *
 * PURPOSE:
 * - Provide a persistent, read-only live snapshot via IPC
 * - Snapshot is cached in-memory to prevent disappearance on tab navigation
 *
 * CRITICAL GUARANTEE:
 * - Snapshot NEVER returns undefined
 * - Snapshot is NOT recomputed on renderer navigation
 *
 * NOTE:
 * - This file does NOT modify holdings, UI, Portfolio, or Dashboard
 */

let LIVE_SNAPSHOT = null;
let LAST_UPDATED = null;

/**
 * Build the live snapshot ONCE.
 * This function can be safely extended later, but must remain deterministic.
 */
function buildLiveSnapshot() {
  const now = Date.now();

  return {
    meta: {
      source: 'LIVE_IPC',
      createdAt: now,
      updatedAt: now,
      immutable: true,
    },

    // IMPORTANT:
    // We preserve structure even if values are later enriched
    signals: [
      {
        symbol: 'PORTFOLIO',
        assetClass: 'aggregate',
        momentum: '-',
        meanReversion: '-',
        portfolioImpact: 'Low',
        confidence: 'Low',
        delta: '↓',
      },
    ],
  };
}

/**
 * PUBLIC API
 * Called by IPC handlers.
 * Always returns a stable snapshot object.
 */
export function getLiveSnapshot() {
  if (!LIVE_SNAPSHOT) {
    LIVE_SNAPSHOT = buildLiveSnapshot();
    LAST_UPDATED = Date.now();

    console.log('[LIVE_SNAPSHOT] Initialized persistent snapshot');
  }

  return {
    snapshot: LIVE_SNAPSHOT,
    timestamp: LAST_UPDATED,
  };
}

/**
 * OPTIONAL (NOT USED YET)
 * Allows controlled refresh later without breaking persistence
 */
export function refreshLiveSnapshot() {
  LIVE_SNAPSHOT = buildLiveSnapshot();
  LAST_UPDATED = Date.now();

  console.log('[LIVE_SNAPSHOT] Snapshot refreshed');
}

