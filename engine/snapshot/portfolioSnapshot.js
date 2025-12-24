/**
 * engine/snapshot/portfolioSnapshot.js
 * CAD-denominated authoritative snapshot
 */

import { resolvePrices } from "../market/priceResolver.js";

export async function buildPortfolioSnapshot(positions, previousSnapshot = {}) {
  const prices = await resolvePrices(positions);

  let totalSnapshot = 0;
  let totalLive = 0;

  const rows = positions.map(pos => {
    const priceEntry = prices[pos.symbol];
    const liveValue = (priceEntry?.price ?? 0) * pos.qty;
    const snapshotValue = previousSnapshot[pos.symbol]?.snapshotValue ?? 0;

    const delta = liveValue - snapshotValue;
    const deltaPct =
      snapshotValue > 0 ? (delta / snapshotValue) * 100 : 0;

    totalSnapshot += snapshotValue;
    totalLive += liveValue;

    return {
      symbol: pos.symbol,
      qty: pos.qty,
      snapshotValue,
      liveValue,
      delta,
      deltaPct,
      currency: "CAD",
      priceSource: priceEntry?.source ?? "unknown"
    };
  });

  return {
    currency: "CAD",
    totals: {
      snapshot: totalSnapshot,
      live: totalLive,
      delta: totalLive - totalSnapshot,
      deltaPct:
        totalSnapshot > 0
          ? ((totalLive - totalSnapshot) / totalSnapshot) * 100
          : 0
    },
    rows
  };
}

