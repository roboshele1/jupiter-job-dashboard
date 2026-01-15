// engine/portfolio/portfolioEngine.js
// AUTHORITATIVE PORTFOLIO ENGINE — BROADCAST SPINE V1

import { EventEmitter } from "events";
import { valuePortfolio } from "./portfolioValuation.js";

/**
 * Internal mutable state (engine-only)
 */
let holdings = [
  { symbol: "NVDA", qty: 73, assetClass: "equity", totalCostBasis: 12881.13, currency: "CAD" },
  { symbol: "ASML", qty: 10, assetClass: "equity", totalCostBasis: 8649.52, currency: "CAD" },
  { symbol: "AVGO", qty: 74, assetClass: "equity", totalCostBasis: 26190.68, currency: "CAD" },
  { symbol: "MSTR", qty: 24, assetClass: "equity", totalCostBasis: 12496.18, currency: "CAD" },
  { symbol: "HOOD", qty: 70, assetClass: "equity", totalCostBasis: 3316.68, currency: "CAD" },
  { symbol: "BMNR", qty: 115, assetClass: "equity", totalCostBasis: 6320.18, currency: "CAD" },
  { symbol: "APLD", qty: 150, assetClass: "equity", totalCostBasis: 1615.58, currency: "CAD" },
  { symbol: "BTC", qty: 0.251083, assetClass: "crypto", totalCostBasis: 24764.31, currency: "CAD" },
  { symbol: "ETH", qty: 0.25, assetClass: "crypto", totalCostBasis: 597.9, currency: "CAD" }
];

/**
 * Event bus (engine → world)
 */
const portfolioEvents = new EventEmitter();

/**
 * Last immutable snapshot
 */
let lastSnapshot = null;

/**
 * Normalize + freeze snapshot
 */
async function computeSnapshot() {
  const valuation = await valuePortfolio(holdings);

  const snapshot = Object.freeze({
    timestamp: Date.now(),
    portfolio: valuation
  });

  lastSnapshot = snapshot;

  // 🔔 SINGLE AUTHORITATIVE BROADCAST
  portfolioEvents.emit("PORTFOLIO_UPDATED", snapshot);

  return snapshot;
}

/**
 * ===== READ API =====
 */
export function getPortfolioSnapshot() {
  return lastSnapshot;
}

export function onPortfolioUpdated(handler) {
  portfolioEvents.on("PORTFOLIO_UPDATED", handler);
}

/**
 * ===== MUTATIONS =====
 */
export async function addHolding({ symbol, qty, assetClass, totalCostBasis, currency }) {
  if (!symbol || qty == null || qty <= 0) {
    throw new Error("INVALID_HOLDING");
  }

  holdings.push({ symbol, qty, assetClass, totalCostBasis, currency });
  return computeSnapshot();
}

export async function updateHolding({ symbol, qty }) {
  if (!symbol || qty == null || qty <= 0) {
    throw new Error("INVALID_QTY");
  }

  const h = holdings.find(h => h.symbol === symbol);
  if (!h) throw new Error("HOLDING_NOT_FOUND");

  h.qty = qty;
  return computeSnapshot();
}

export async function removeHolding({ symbol }) {
  holdings = holdings.filter(h => h.symbol !== symbol);
  return computeSnapshot();
}

/**
 * ===== BOOTSTRAP =====
 * Ensure snapshot exists once engine loads
 */
computeSnapshot();
