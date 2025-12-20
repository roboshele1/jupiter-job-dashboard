// engine/marketMonitorEngine.js
// LIVE Market Monitor — Crypto only (BTC, ETH)
// Source: priceService (Coinbase)

import { getPrices } from "./priceService.js";

let lastSnapshot = null;

export async function getMarketMonitorSnapshot() {
  const prices = await getPrices(["BTC", "ETH"]);

  lastSnapshot = {
    timestamp: new Date().toISOString(),
    assets: {
      BTC: prices.BTC,
      ETH: prices.ETH,
    },
  };

  return lastSnapshot;
}

export function getLastMarketMonitorSnapshot() {
  return lastSnapshot;
}

