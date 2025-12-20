import holdings from "../../renderer/data/holdings.js";

export function computePortfolioTotals(snapshot = holdings) {
  let totalValue = 0;
  let dailyPL = 0;

  const rows = snapshot.map((h) => {
    const value = h.price * h.quantity;
    totalValue += value;
    dailyPL += h.dailyPL || 0;

    return {
      ...h,
      value,
      dailyPL: h.dailyPL || 0,
      t1DeltaPct: h.t1DeltaPct || 0,
    };
  });

  return {
    rows,
    totalValue,
    dailyPL,
    timestamp: Date.now(),
  };
}

