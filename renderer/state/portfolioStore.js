import { create } from "zustand";
import { getPortfolioSnapshot } from "../services/portfolioEngine";

export const usePortfolioStore = create((set, get) => ({
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
      set({ error: err.message, loading: false });
    }
  }
}));

