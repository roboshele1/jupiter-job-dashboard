// preload.js
// JUPITER — Secure preload bridge

const { contextBridge } = require("electron");

// AUTHORITATIVE SNAPSHOT — SINGLE SOURCE OF TRUTH
const portfolioSnapshot = {
  contract: "PORTFOLIO_SNAPSHOT_V1",
  currency: "USD",
  totals: {
    snapshotValue: 23300.27,
    liveValue: 22606.40,
    delta: -693.87,
    deltaPct: -2.98
  },
  positions: [
    { symbol: "BTC", qty: 0.251083, assetClass: "crypto", snapshot: 22597.47, live: 21848.25 },
    { symbol: "ETH", qty: 0.25, assetClass: "crypto", snapshot: 702.8, live: 731.84 },
    { symbol: "NVDA", qty: 73, assetClass: "equity", snapshot: 0, live: 13812.33 },
    { symbol: "ASML", qty: 10, assetClass: "equity", snapshot: 0, live: 10618.4 },
    { symbol: "AVGO", qty: 74, assetClass: "equity", snapshot: 0, live: 25849.68 },
    { symbol: "MSTR", qty: 24, assetClass: "equity", snapshot: 0, live: 3789.12 },
    { symbol: "HOOD", qty: 70, assetClass: "equity", snapshot: 0, live: 8416.8 },
    { symbol: "BMNR", qty: 115, assetClass: "equity", snapshot: 0, live: 3424.7 },
    { symbol: "APLD", qty: 150, assetClass: "equity", snapshot: 0, live: 3912.0 }
  ]
};

contextBridge.exposeInMainWorld("__JUPITER_PORTFOLIO_SNAPSHOT__", portfolioSnapshot);

