// renderer/state/portfolioSnapshotStore.js
import { create } from "zustand";

export const usePortfolioSnapshotStore = create(() => ({
  holdings: [
    { symbol: "ASML", qty: 10, value: 10560.2 },
    { symbol: "NVDA", qty: 73, value: 13212.27 },
    { symbol: "AVGO", qty: 74, value: 27228.8 },
    { symbol: "BTC", qty: 0.251, value: 22597.47 },
    { symbol: "ETH", qty: 1, value: 702.8 },
    { symbol: "MSTR", qty: 24, value: 4120.5 },
    { symbol: "HOOD", qty: 70, value: 4247.25 },
    { symbol: "BMNR", qty: 115, value: 2300 },
    { symbol: "APLD", qty: 150, value: 5482.05 },
  ],
}));

