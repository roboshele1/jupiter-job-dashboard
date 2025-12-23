// renderer/state/portfolioStore.js
// SEALED SNAPSHOT STORE — READ ONLY
// Builds a stable snapshot for UI consumers (Dashboard / Portfolio / Risk)

import { create } from "zustand";
import { holdings } from "./holdings"; // BASELINE holdings source (unchanged)
import { getPortfolioSummary, getPortfolioAllocation } from "../services/portfolioSnapshot";

/**
 * Snapshot contract:
 * snapshot = null (pre-hydration) OR
 * snapshot = { meta, summary, allocation, holdings }
 */
function buildSnapshot(inputHoldings = []) {
  const safeHoldings = Array.isArray(inputHoldings) ? inputHoldings : [];

  return {
    meta: {
      source: "baseline",
      snapshotTime: new Date().toISOString(),
    },
    summary: getPortfolioSummary(safeHoldings),
    allocation: getPortfolioAllocation(safeHoldings),
    holdings: safeHoldings,
  };
}

export const usePortfolioStore = create((set, get) => ({
  snapshot: null,
  loading: false,
  error: null,

  hydrate: async () => {
    if (get().loading || get().snapshot) return;

    set({ loading: true, error: null });

    try {
      const snapshot = buildSnapshot(holdings);

      set({
        snapshot,
        loading: false,
      });
    } catch (err) {
      set({
        error: err?.message || "Snapshot build failed",
        loading: false,
      });
    }
  },
}));

