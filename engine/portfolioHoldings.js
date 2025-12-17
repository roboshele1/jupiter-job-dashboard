/**
 * JUPITER — Portfolio Holdings Model
 * Phase 12 Step 1
 *
 * Canonical, read-only representation of portfolio positions.
 * No pricing. No P/L. No execution.
 */

const HOLDINGS_KEY = "JUPITER_PORTFOLIO_HOLDINGS";

/**
 * Holding schema:
 * {
 *   symbol: string
 *   quantity: number
 *   costBasis: number   // average cost per unit
 *   assetType: "EQUITY" | "ETF" | "CRYPTO" | "CASH"
 * }
 */

function loadHoldings() {
  try {
    const raw = localStorage.getItem(HOLDINGS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveHoldings(holdings) {
  localStorage.setItem(HOLDINGS_KEY, JSON.stringify(holdings));
}

/**
 * Initialize holdings (manual, controlled, idempotent)
 * This does NOT update prices or execute trades.
 */
export function initializeHoldings(initialHoldings = []) {
  if (loadHoldings().length > 0) return;
  saveHoldings(initialHoldings);
}

/**
 * Read-only access to holdings
 */
export function getHoldings() {
  return loadHoldings().slice();
}

/**
 * Contract metadata
 */
export const PORTFOLIO_HOLDINGS_CONTRACT = Object.freeze({
  version: "1.0.0",
  phaseLocked: 12,
  mutable: false,
  executionSafe: true,
  description:
    "Canonical holdings model. Quantity and cost basis only. No pricing.",
});

