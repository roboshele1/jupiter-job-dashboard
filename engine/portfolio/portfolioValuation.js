// engine/portfolio/portfolioValuation.js
// D9.3 — Portfolio valuation with freshness (AUTHORITATIVE)

import { resolvePrices } from "../market/priceResolver.js";
import { applyPriceFreshness } from "../market/priceFreshnessEngine.js";

export async function valuePortfolio(holdings = []) {
  if (!Array.isArray(holdings)) holdings = [];

  const resolverInput = holdings.map(h => ({
    symbol: h.symbol,
    type: h.assetClass === "crypto" ? "crypto" : "equity"
  }));

  const resolved = await resolvePrices(resolverInput);

  // 🔒 Apply freshness ONCE at engine boundary
  const enrichedSnapshot = applyPriceFreshness(resolved);

  const positions = holdings.map(h => {
    const r = enrichedSnapshot.prices?.[h.symbol] ?? {
      price: 0,
      source: "unknown",
      currency: h.currency ?? "CAD",
      freshness: null
    };

    const livePrice = Number(r.price) || 0;
    const snapshotValue = Number(h.totalCostBasis) || 0;
    const liveValue = (Number(h.qty) || 0) * livePrice;
    const delta = liveValue - snapshotValue;
    const deltaPct = snapshotValue > 0 ? (delta / snapshotValue) * 100 : 0;

    return {
      symbol: h.symbol,
      qty: h.qty,
      assetClass: h.assetClass,
      snapshotValue,
      livePrice,
      liveValue,
      delta,
      deltaPct,
      currency: r.currency ?? "CAD",
      priceSource: r.source,
      priceFreshness: r.freshness
    };
  });

  const totals = positions.reduce(
    (acc, p) => {
      acc.snapshotValue += p.snapshotValue;
      acc.liveValue += p.liveValue;
      acc.delta += p.delta;
      return acc;
    },
    { snapshotValue: 0, liveValue: 0, delta: 0 }
  );

  totals.deltaPct =
    totals.snapshotValue > 0
      ? (totals.delta / totals.snapshotValue) * 100
      : 0;

  return {
    contract: "PORTFOLIO_VALUATION_DETERMINISTIC_V2",
    currency: "CAD",
    fetchedAt: enrichedSnapshot.fetchedAt,
    totals,
    positions,
    priceSnapshotMeta: {
      contract: enrichedSnapshot.contract,
      source: enrichedSnapshot.source,
      fetchedAt: enrichedSnapshot.fetchedAt
    }
  };
}

