// renderer/services/getPortfolioSnapshot.js
// Canonical snapshot facade for renderer (V9)
// READ-ONLY — engine authoritative
// NO local derivation
// NO duplication
// NO mutation

/**
 * This service is the ONLY way the renderer
 * consumes portfolio data.
 *
 * Source of truth:
 *   Electron IPC → engine read snapshot
 */

export async function getPortfolioSnapshot() {
  if (!window?.jupiter?.invoke) {
    throw new Error("IPC_BRIDGE_UNAVAILABLE");
  }

  // Canonical engine snapshot
  const snapshot = await window.jupiter.invoke("portfolio:getSnapshot");

  if (!snapshot) {
    throw new Error("PORTFOLIO_SNAPSHOT_EMPTY");
  }

  return snapshot;
}
