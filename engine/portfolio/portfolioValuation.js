// engine/portfolio/portfolioValuation.js
// D8.5 — Unified Price Resolver wiring (AUTHORITATIVE)
// Portfolio valuation MUST route through Unified Price Resolver only

import { resolvePrices } from "../market/priceResolver.js";

export async function valuePortfolio(holdings = []) {
  if (!Array.isArray(holdings)) holdings = [];

  // Normalize positions for resolver
  const resolverInput = holdings.map(h => ({
    symbol: h.symbol,
    type: h.assetClass === "crypto" ? "crypto" : "equity"
  }));

  // 🔒 AUTHORITATIVE PRICE SOURCE
  const resolved = await resolvePrices(resolverInput);

  const positions = holdings.map(h => {
    const r = resolved.prices?.[h.symbol] ?? {
      price: 0,
      source: "unknown",
      currency: h.currency ?? "CAD"
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
      currency: r.currency,
      priceSource: r.source,
      timestamp: Date.now()
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
    contract: "PORTFOLIO_VALUATION_DETERMINISTIC_V1",
    currency: "CAD",
    totals,
    positions,
    priceSnapshotMeta: {
      contract: resolved.contract,
      source: resolved.source,
      fetchedAt: resolved.fetchedAt
    }
  };
}

