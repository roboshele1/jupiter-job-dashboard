// engine/portfolio/portfolioHoldings.js
// PORTFOLIO AUTHORITY — CANONICAL HOLDINGS SOURCE
// Reads from holdings.json (written by Manage Holdings UI)
// Engine, valuation, snapshots all derive from here.

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const HOLDINGS_PATH = path.resolve(__dirname, "../../engine/data/users/default/holdings.json");

export function getCurrentHoldings() {
  try {
    const raw = fs.readFileSync(HOLDINGS_PATH, "utf-8");
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(h => ({
      symbol:   h.symbol,
      quantity: h.qty ?? h.quantity ?? 0,
      ...(h.totalCostBasis != null && { totalCostBasis: h.totalCostBasis }),
      ...(h.assetClass     != null && { assetClass:     h.assetClass }),
      ...(h.currency       != null && { currency:       h.currency }),
    }));
  } catch (e) {
    console.error("[portfolioHoldings] Failed to read holdings.json:", e.message);
    return [];
  }
}
