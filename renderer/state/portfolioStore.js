import { create } from "zustand";

export const usePortfolioStore = create((set) => ({
  portfolio: [],
  totals: {
    totalValue: 0,
    dailyPL: 0,
    dailyPLPct: 0,
  },
  status: "IDLE",

  hydrateFromEngine: async () => {
    try {
      set({ status: "LOADING" });

      if (!window?.api?.getPortfolio) {
        set({ status: "NO_ENGINE" });
        return;
      }

      const data = await window.api.getPortfolio();

      const totalValue = data.reduce(
        (sum, p) => sum + Number(p.value || 0),
        0
      );

      set({
        portfolio: data,
        totals: {
          totalValue,
          dailyPL: 0,
          dailyPLPct: 0,
        },
        status: "READY",
      });
    } catch (err) {
      console.error("Portfolio hydration failed:", err);
      set({ status: "ERROR" });
    }
  },
}));

