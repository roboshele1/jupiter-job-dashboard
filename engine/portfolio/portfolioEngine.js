/**
 * JUPITER — Portfolio Engine (Editable V1)
 * ---------------------------------------
 * Single authoritative mutation boundary for portfolio holdings.
 *
 * RULES:
 * - Engine owns mutation
 * - Disk-backed persistence
 * - No pricing, no analytics
 * - Deterministic + testable
 */

const fs = require("fs");
const path = require("path");

// Canonical holdings file (V1)
const HOLDINGS_PATH = path.resolve(__dirname, "../data/holdings.js");

/* =========================
   INTERNAL HELPERS
   ========================= */

function loadHoldings() {
  delete require.cache[require.resolve(HOLDINGS_PATH)];
  const holdings = require(HOLDINGS_PATH);

  if (!Array.isArray(holdings)) {
    throw new Error("HOLDINGS_FILE_INVALID");
  }

  return holdings.map(h => ({
    symbol: String(h.symbol),
    qty: Number(h.qty)
  }));
}

function persistHoldings(holdings) {
  const content = `/**
 * JUPITER — Canonical Holdings Authority (V1)
 * AUTO-GENERATED — DO NOT EDIT MANUALLY
 */

module.exports = ${JSON.stringify(holdings, null, 2)};
`;

  fs.writeFileSync(HOLDINGS_PATH, content, "utf8");
}

/* =========================
   READ API
   ========================= */

function getPortfolioSnapshot() {
  const holdings = loadHoldings();

  return Object.freeze({
    contract: "PORTFOLIO_ENGINE_V1",
    timestamp: Date.now(),
    positions: holdings
  });
}

/* =========================
   MUTATION API
   ========================= */

function addHolding(symbol, qty) {
  if (!symbol || typeof symbol !== "string") {
    throw new Error("INVALID_SYMBOL");
  }
  if (typeof qty !== "number" || qty <= 0) {
    throw new Error("INVALID_QTY");
  }

  const holdings = loadHoldings();

  if (holdings.find(h => h.symbol === symbol)) {
    throw new Error("HOLDING_ALREADY_EXISTS");
  }

  holdings.push({ symbol, qty });
  persistHoldings(holdings);

  return getPortfolioSnapshot();
}

function updateHolding(symbol, qty) {
  if (!symbol || typeof symbol !== "string") {
    throw new Error("INVALID_SYMBOL");
  }
  if (typeof qty !== "number" || qty <= 0) {
    throw new Error("INVALID_QTY");
  }

  const holdings = loadHoldings();
  const target = holdings.find(h => h.symbol === symbol);

  if (!target) {
    throw new Error("HOLDING_NOT_FOUND");
  }

  target.qty = qty;
  persistHoldings(holdings);

  return getPortfolioSnapshot();
}

function removeHolding(symbol) {
  if (!symbol || typeof symbol !== "string") {
    throw new Error("INVALID_SYMBOL");
  }

  const holdings = loadHoldings();
  const next = holdings.filter(h => h.symbol !== symbol);

  if (next.length === holdings.length) {
    throw new Error("HOLDING_NOT_FOUND");
  }

  persistHoldings(next);
  return getPortfolioSnapshot();
}

/* =========================
   EXPORTS
   ========================= */

module.exports = Object.freeze({
  getPortfolioSnapshot,
  addHolding,
  updateHolding,
  removeHolding
});
