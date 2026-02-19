/**
 * PORTFOLIO COST BASIS — DISK-BACKED, NO HARDCODED VALUES
 * Reads and writes cost basis from holdings.json directly.
 * New stocks are automatically added when purchased.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const HOLDINGS_PATH = path.resolve(__dirname, '../../engine/data/users/default/holdings.json');

function loadHoldings() {
  try {
    const raw = fs.readFileSync(HOLDINGS_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveHoldings(holdings) {
  fs.mkdirSync(path.dirname(HOLDINGS_PATH), { recursive: true });
  fs.writeFileSync(HOLDINGS_PATH, JSON.stringify(holdings, null, 2));
}

export function getCostBasis(symbol) {
  const holdings = loadHoldings();
  const h = holdings.find(h => h.symbol?.toUpperCase() === symbol?.toUpperCase());
  return h?.totalCostBasis ?? h?.costBasis ?? 0;
}

export function getAllCostBasis() {
  const holdings = loadHoldings();
  const result = {};
  holdings.forEach(h => {
    if (h.symbol) result[h.symbol.toUpperCase()] = h.totalCostBasis ?? h.costBasis ?? 0;
  });
  return result;
}

export function updateCostBasis(symbol, qtyDelta, tradeCost) {
  const holdings = loadHoldings();
  const sym = symbol.toUpperCase();
  const idx = holdings.findIndex(h => h.symbol?.toUpperCase() === sym);

  if (idx === -1) {
    // New holding — add it
    if (qtyDelta > 0) {
      holdings.push({
        symbol: sym,
        qty: qtyDelta,
        totalCostBasis: tradeCost,
        assetClass: 'equity',
      });
      saveHoldings(holdings);
    }
    return;
  }

  const h = holdings[idx];
  const existingQty  = Number(h.qty) || 0;
  const existingCost = Number(h.totalCostBasis ?? h.costBasis) || 0;
  const newQty = existingQty + qtyDelta;

  if (newQty <= 0) {
    holdings.splice(idx, 1);
    saveHoldings(holdings);
    return;
  }

  if (qtyDelta > 0) {
    holdings[idx].totalCostBasis = existingCost + tradeCost;
  }
  holdings[idx].qty = newQty;
  saveHoldings(holdings);
}
