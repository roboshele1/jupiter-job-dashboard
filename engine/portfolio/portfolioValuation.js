/**
 * engine/portfolio/portfolioValuation.js
 * Terminal-authoritative portfolio valuation + totals
 */

import { resolvePrice } from "../market/priceResolver.js";

export async function valuePortfolio(holdings) {
  const positions = [];
  let totalValue = 0;

  // First pass: resolve prices + values
  for (const h of holdings) {
    const resolved = await resolvePrice(h);

    const price = Number(resolved.price || 0);
    const qty = Number(h.qty || 0);

    const value =
      price > 0 && qty > 0
        ? Number((price * qty).toFixed(2))
        : null;

    if (value !== null) totalValue += value;

    positions.push({
      symbol: h.symbol,
      qty,
      assetClass: h.assetClass,
      price,
      value,
      priceSource: resolved.source,
      timestamp: resolved.timestamp
    });
  }

  // Second pass: compute weights
  const enriched = positions.map(p => ({
    ...p,
    weightPct:
      p.value !== null && totalValue > 0
        ? Number(((p.value / totalValue) * 100).toFixed(2))
        : null
  }));

  return {
    totalValue: Number(totalValue.toFixed(2)),
    currency: "USD",
    positions: enriched
  };
}

