import { create } from "zustand";

export const usePortfolioSnapshotStore = create(set => ({
  snapshot: null,

  writeSnapshot: snapshot => {
    set({ snapshot });
  }
}));

