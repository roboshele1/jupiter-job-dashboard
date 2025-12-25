// engine/portfolio/portfolioEngine.js

import { loadPortfolioHoldings } from "./portfolioHoldings.js";
import { getLivePrices } from "../market/getLivePrices.js";
import { writePortfolioSnapshot } from "./portfolioSnapshotWriter.js";

export async function refreshPortfolioValuation() {
  const holdings = await loadPortfolioHoldings();

  // No holdings = zeroed snapshot (valid state)
  if (!holdings.length) {
    const empty = {
      contract: "PORTFOLIO_VALUATION_DETERMINISTIC_V1",
      currency: "CAD",
      totals: {
        snapshotValue: 0,
        liveValue: 0,
        delta: 0,
        deltaPct: 0,
      },
      positions: [],
    };

    await writePortfolioSnapshot(empty);
    return empty;
  }

  const symbols = holdings.map(h => h.symbol);
  const prices = await getLivePrices(symbols);

  let liveValue = 0;

  const positions = holdings.map(h => {
    const price = prices[h.symbol]?.price ?? 0;
    const value = h.qty * price;
    liveValue += value;

    return {
      symbol: h.symbol,
      qty: h.qty,
      livePrice: price,
      liveValue: value,
      currency: "CAD",
    };
  });

  const snapshot = {
    contract: "PORTFOLIO_VALUATION_DETERMINISTIC_V1",
    currency: "CAD",
    totals: {
      snapshotValue: liveValue,
      liveValue,
      delta: 0,
      deltaPct: 0,
    },
    positions,
  };

  await writePortfolioSnapshot(snapshot);
  return snapshot;
}

