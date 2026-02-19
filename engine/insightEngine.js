// engine/insightEngine.js
// V1 HARDENED ENGINE EXPORT
// Purpose: Provide a guaranteed, boot-safe export for Electron + Renderer
// This file is READ-ONLY LOGIC. No side effects.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __insight_dirname = path.dirname(fileURLToPath(import.meta.url));
const __HOLDINGS_JSON = path.resolve(__insight_dirname, '../data/users/default/holdings.json');

function _loadHoldings() {
  try {
    return JSON.parse(fs.readFileSync(__HOLDINGS_JSON, 'utf-8'));
  } catch (e) {
    console.error('[insightEngine] Cannot read holdings.json:', e.message);
    return [];
  }
}
const holdings = _loadHoldings();

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

