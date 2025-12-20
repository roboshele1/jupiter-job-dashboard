// engine/valuation/allocationEngine.js
export function computeAllocation(breakdown) {
  const totals = {};
  let portfolioTotal = 0;

  breakdown.forEach(b => {
    totals[b.type] = (totals[b.type] || 0) + b.value;
    portfolioTotal += b.value;
  });

  Object.keys(totals).forEach(k => {
    totals[k] = +(totals[k] / portfolioTotal * 100).toFixed(2);
  });

  return totals;
}

