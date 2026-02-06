/**
 * JUPITER — Portfolio Engine (V2.1)
 * -----------------------------------------
 * Canonical mutation authority for holdings.
 *
 * FIX:
 * - Existing symbols bypass resolver (deterministic)
 * - Resolver only used for brand-new symbols
 * - Quantity updates ALWAYS adjust book cost
 */

const fs = require("fs");
const path = require("path");

const resolverModule = require("../symbolUniverse/resolveInvestableSymbol.js");
const resolveInvestableSymbol =
  resolverModule.resolveInvestableSymbol || resolverModule.default;

const HOLDINGS_PATH = path.resolve(__dirname, "../data/holdings.js");

/* =========================
   INTERNAL HELPERS
   ========================= */

function loadHoldings() {
  delete require.cache[require.resolve(HOLDINGS_PATH)];
  const h = require(HOLDINGS_PATH);
  if (!Array.isArray(h)) throw new Error("HOLDINGS_FILE_INVALID");
  return h.map(x => ({ ...x }));
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

async function resolveIfNew(symbol, holdings) {
  const normalized = String(symbol).toUpperCase();

  if (holdings.some(h => h.symbol === normalized)) {
    return normalized; // already known → valid
  }

  const res = await resolveInvestableSymbol(normalized);
  if (!res?.valid) throw new Error("INVALID_SYMBOL");
  return res.symbol;
}

/* =========================
   READ
   ========================= */

function getPortfolioSnapshot() {
  return Object.freeze({
    timestamp: Date.now(),
    positions: loadHoldings()
  });
}

/* =========================
   MUTATIONS
   ========================= */

async function addHolding({ symbol, qty, cost }) {
  if (!Number.isFinite(qty) || qty <= 0) throw new Error("INVALID_QTY");
  if (!Number.isFinite(cost) || cost <= 0) throw new Error("INVALID_COST");

  const holdings = loadHoldings();
  const s = await resolveIfNew(symbol, holdings);

  const h = holdings.find(x => x.symbol === s);

  if (h) {
    h.qty += qty;
    h.totalCostBasis += cost;
  } else {
    holdings.push({
      symbol: s,
      qty,
      totalCostBasis: cost,
      assetClass: "equity",
      currency: "USD"
    });
  }

  persistHoldings(holdings);
  return getPortfolioSnapshot();
}

async function updateHolding({ symbol, qtyDelta }) {
  if (!Number.isFinite(qtyDelta) || qtyDelta === 0)
    throw new Error("INVALID_QTY_DELTA");

  const holdings = loadHoldings();
  const s = String(symbol).toUpperCase();
  const h = holdings.find(x => x.symbol === s);

  if (!h) throw new Error("HOLDING_NOT_FOUND");

  const avgCost = h.totalCostBasis / h.qty;
  const newQty = h.qty + qtyDelta;

  if (newQty < 0) throw new Error("QTY_EXCEEDS_HOLDING");

  if (newQty === 0) {
    persistHoldings(holdings.filter(x => x.symbol !== s));
    return getPortfolioSnapshot();
  }

  if (qtyDelta < 0) {
    h.totalCostBasis += avgCost * qtyDelta; // qtyDelta negative
  }

  h.qty = newQty;
  persistHoldings(holdings);
  return getPortfolioSnapshot();
}

async function removeHolding({ symbol }) {
  const s = String(symbol).toUpperCase();
  const holdings = loadHoldings();
  persistHoldings(holdings.filter(x => x.symbol !== s));
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
