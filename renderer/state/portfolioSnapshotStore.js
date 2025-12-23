// renderer/state/portfolioSnapshotStore.js
// Read-only snapshot store (sealed contract)

import { create } from "zustand";
import { getPortfolioSnapshot } from "../services/getPortfolioSnapshot";

export const usePortfolioSnapshotStore = create((set, get) => ({
  snapshot: null,
  loading: false,
  error: null,

  hydrate: async () => {
    if (get().loading) return;

    set({ loading: true, error: null });

    try {
      const snapshot = await getPortfolioSnapshot();
      set({ snapshot, loading: false });
    } catch (err) {
      set({
        error: err?.message || "Snapshot failed",
        loading: false
      });
    }
  }
}));

