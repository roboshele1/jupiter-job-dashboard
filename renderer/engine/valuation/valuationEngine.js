// renderer/engine/valuation/valuationEngine.js
// Phase 5: Live valuation layer
// Pure function — no side effects

export function valueHoldings({ holdings, prices }) {
  if (!holdings || !prices) {
    return {
      available: false,
      reason: "Missing holdings or prices"
    };
  }

  let totalValue = 0;
  const valuedHoldings = [];

  for (const h of holdings) {
    const priceObj = prices[h.symbol];

    if (!priceObj || typeof priceObj.price !== "number") {
      valuedHoldings.push({
        ...h,
        price: null,
        value: null
      });
      continue;
    }

    const value = h.quantity * priceObj.price;
    totalValue += value;

    valuedHoldings.push({
      ...h,
      price: priceObj.price,
      value
    });
  }

  return {
    available: true,
    totalValue,
    holdings: valuedHoldings
  };
}

