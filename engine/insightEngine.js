// engine/insightEngine.js
// V1 HARDENED ENGINE EXPORT
// Purpose: Provide a guaranteed, boot-safe export for Electron + Renderer
// This file is READ-ONLY LOGIC. No side effects.

import holdings from "../data/holdings.js";

/**
 * Computes total portfolio value and daily P/L
 * Safe against missing or malformed data
 */
export function computePortfolioTotals() {
  let totalValue = 0;
  let dailyPL = 0;

  if (!Array.isArray(holdings)) {
    return {
      totalValue: 0,
      dailyPL: 0,
    };
  }

  for (const h of holdings) {
    const quantity = Number(h.quantity) || 0;
    const price = Number(h.price) || 0;
    const daily = Number(h.dailyPL) || 0;

    totalValue += quantity * price;
    dailyPL += daily;
  }

  return {
    totalValue,
    dailyPL,
  };
}

/**
 * Default export retained for forward compatibility
 * (V2 engines may compose this)
 */
export default {
  computePortfolioTotals,
};

