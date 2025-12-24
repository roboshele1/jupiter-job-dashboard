import { getLivePrices } from "../market/getLivePrices.js";

export async function valuePortfolio(holdings = []) {
  const symbols = holdings.map(h => h.symbol);
  const livePrices = await getLivePrices(symbols);

  const positions = holdings.map(h => {
    const livePrice = livePrices[h.symbol]?.price ?? 0;
    const snapshotValue = h.totalCostBasis;
    const liveValue = h.qty * livePrice;
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
      currency: h.currency,
      priceSource: livePrices[h.symbol]?.source ?? "unknown",
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
    positions
  };
}

