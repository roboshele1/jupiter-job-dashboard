/**
 * Context Assembler — Portfolio Intelligence Bridge
 * -------------------------------------------------
 * D5 — Portfolio Authority Wiring (Deterministic)
 */

import { valuePortfolio } from "../portfolio/portfolioValuation.js";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const HOLDINGS_PATH = "../data/holdings.js";

function normalizeSymbol(symbol) {
  return String(symbol || "").trim().toUpperCase();
}

function asNumber(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function loadHoldingsAuthority() {
  const resolved = require.resolve(HOLDINGS_PATH);
  delete require.cache[resolved];

  const raw = require(HOLDINGS_PATH);
  if (!Array.isArray(raw)) return [];

  return raw.map(h => ({
    symbol: normalizeSymbol(h.symbol),
    qty: asNumber(h.qty),
    assetClass:
      normalizeSymbol(h.symbol) === "BTC" ||
      normalizeSymbol(h.symbol) === "ETH"
        ? "crypto"
        : "equity",
    totalCostBasis: asNumber(h.totalCostBasis),
    currency: String(h.currency || "USD")
  }));
}

export async function assembleIntelligenceContext() {
  const holdings = loadHoldingsAuthority();

  if (!holdings.length) {
    return {
      contextAvailable: false,
      portfolioValue: 0,
      positions: [],
      totals: null,
      source: "portfolio-authority-empty"
    };
  }

  const valuation = await valuePortfolio(
    holdings.map(h => ({
      symbol: h.symbol,
      qty: h.qty,
      assetClass: h.assetClass,
      totalCostBasis: h.totalCostBasis,
      currency: h.currency
    }))
  );

  return Object.freeze({
    contextAvailable: true,
    portfolioValue: valuation?.totals?.liveValue || 0,
    positions: valuation?.positions || [],
    totals: valuation?.totals || null,
    fetchedAt: valuation?.fetchedAt || null,
    source: "portfolio-authority"
  });
}
