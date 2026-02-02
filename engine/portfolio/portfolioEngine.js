/**
 * JUPITER — Portfolio Engine (Editable V1.1)
 * -----------------------------------------
 * Single authoritative mutation boundary for portfolio holdings.
 *
 * INVARIANT (STEP 1):
 * - Dynamic symbol validation via resolver
 * - No UI logic
 * - No pricing logic
 * - No IPC logic
 * - Disk-backed persistence
 */

const fs = require("fs");
const path = require("path");

/* =========================
   Symbol Resolver (ENGINE)
   ========================= */
const resolverModule = require("../symbolUniverse/resolveInvestableSymbol.js");
const resolveInvestableSymbol =
  resolverModule.resolveInvestableSymbol || resolverModule.default;

/* =========================
   Canonical holdings file
   ========================= */
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

async function validateSymbol(symbol) {
  if (!symbol || typeof symbol !== "string") {
    throw new Error("INVALID_SYMBOL");
  }

  const resolution = await resolveInvestableSymbol(symbol);

  if (!resolution || resolution.valid !== true) {
    throw new Error("INVALID_SYMBOL");
  }

  return resolution.symbol; // normalized (e.g. MSFT)
}

async function addHolding(symbol, qty) {
  const resolvedSymbol = await validateSymbol(symbol);

  if (typeof qty !== "number" || qty <= 0) {
    throw new Error("INVALID_QTY");
  }

  const holdings = loadHoldings();

  if (holdings.find(h => h.symbol === resolvedSymbol)) {
    throw new Error("HOLDING_ALREADY_EXISTS");
  }

  holdings.push({ symbol: resolvedSymbol, qty });
  persistHoldings(holdings);

  return getPortfolioSnapshot();
}

async function updateHolding(symbol, qty) {
  const resolvedSymbol = await validateSymbol(symbol);

  if (typeof qty !== "number" || qty <= 0) {
    throw new Error("INVALID_QTY");
  }

  const holdings = loadHoldings();
  const target = holdings.find(h => h.symbol === resolvedSymbol);

  if (!target) {
    throw new Error("HOLDING_NOT_FOUND");
  }

  target.qty = qty;
  persistHoldings(holdings);

  return getPortfolioSnapshot();
}

async function removeHolding(symbol) {
  const resolvedSymbol = await validateSymbol(symbol);

  const holdings = loadHoldings();
  const next = holdings.filter(h => h.symbol !== resolvedSymbol);

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
