// renderer/state/dashboardStore.js
// Dashboard Snapshot Store (LOCKED)

import { create } from "zustand";

export const useDashboardStore = create((set) => ({
  snapshot: null,

  setSnapshot: (snapshot) =>
    set(() => ({
      snapshot,
    })),

  clearSnapshot: () =>
    set(() => ({
      snapshot: null,
    })),
}));

