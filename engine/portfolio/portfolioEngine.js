/**
 * JUPITER — Portfolio Engine (V3.0)
 * ----------------------------------
 * Per-user holdings persistence with full backward compatibility.
 *
 * V3 CHANGES:
 * - Holdings are stored per-user: engine/data/users/{userId}/holdings.json
 * - getUserEngine(userId) factory returns a scoped engine for any user
 * - Default export API (getPortfolioSnapshot, addHolding, updateHolding,
 *   removeHolding) is UNCHANGED — existing IPC handlers need zero modification
 * - userId "default" maps to the original holdings path for zero migration pain
 * - holdings.json replaces holdings.js (JSON is safer to write/parse)
 * - Legacy holdings.js is auto-migrated to holdings.json on first load
 *
 * Multi-user flow:
 *   const engine = getUserEngine("user_abc123");
 *   engine.addHolding({ symbol: "NVDA", qty: 10, cost: 8000 });
 *   engine.getPortfolioSnapshot();
 */

const fs   = require("fs");
const path = require("path");

const resolverModule = require("../symbolUniverse/resolveInvestableSymbol.js");
const resolveInvestableSymbol =
  resolverModule.resolveInvestableSymbol || resolverModule.default;

// ─── Paths ────────────────────────────────────────────────────────────────────

const DATA_ROOT    = path.resolve(__dirname, "../data");
const USERS_ROOT   = path.resolve(DATA_ROOT, "users");
const LEGACY_PATH  = path.resolve(DATA_ROOT, "holdings.js");  // original single-user file

function getUserDir(userId) {
  const safe = String(userId || "default").replace(/[^a-zA-Z0-9_-]/g, "_");
  return path.resolve(USERS_ROOT, safe);
}

function getHoldingsPath(userId) {
  return path.resolve(getUserDir(userId), "holdings.json");
}

function ensureUserDir(userId) {
  const dir = getUserDir(userId);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

// ─── Migration: holdings.js → users/default/holdings.json ────────────────────

function migrateLegacyIfNeeded() {
  const defaultPath = getHoldingsPath("default");
  if (fs.existsSync(defaultPath)) return; // already migrated

  ensureUserDir("default");

  if (fs.existsSync(LEGACY_PATH)) {
    try {
      // Load legacy CommonJS holdings file
      delete require.cache[require.resolve(LEGACY_PATH)];
      const legacy = require(LEGACY_PATH);
      if (Array.isArray(legacy) && legacy.length > 0) {
        fs.writeFileSync(defaultPath, JSON.stringify(legacy, null, 2), "utf8");
        console.log("[PortfolioEngine] Migrated legacy holdings.js → users/default/holdings.json");
        return;
      }
    } catch {
      // legacy file unreadable — start fresh
    }
  }

  // No legacy file — write empty holdings for default user
  fs.writeFileSync(defaultPath, JSON.stringify([], null, 2), "utf8");
  console.log("[PortfolioEngine] Initialised users/default/holdings.json");
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

function loadHoldings(userId) {
  migrateLegacyIfNeeded();
  const holdingsPath = getHoldingsPath(userId);

  if (!fs.existsSync(holdingsPath)) {
    ensureUserDir(userId);
    fs.writeFileSync(holdingsPath, JSON.stringify([], null, 2), "utf8");
    return [];
  }

  try {
    const raw = fs.readFileSync(holdingsPath, "utf8");
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) throw new Error("HOLDINGS_FILE_INVALID");
    return parsed.map(x => ({ ...x }));
  } catch (err) {
    throw new Error(`HOLDINGS_READ_ERROR: ${err.message}`);
  }
}

function persistHoldings(userId, holdings) {
  ensureUserDir(userId);
  const holdingsPath = getHoldingsPath(userId);
  fs.writeFileSync(holdingsPath, JSON.stringify(holdings, null, 2), "utf8");
}

async function resolveIfNew(symbol, holdings) {
  const normalized = String(symbol).toUpperCase();
  if (holdings.some(h => h.symbol === normalized)) {
    return normalized; // already known — skip resolver
  }
  const res = await resolveInvestableSymbol(normalized);
  if (!res?.valid) throw new Error("INVALID_SYMBOL");
  return res.symbol;
}

// ─── Engine factory ───────────────────────────────────────────────────────────

/**
 * Returns a fully scoped portfolio engine for a given user.
 * All operations read/write to that user's holdings file only.
 *
 * @param {string} userId — unique user identifier (e.g. "default", "user_abc")
 * @returns {{ getPortfolioSnapshot, addHolding, updateHolding, removeHolding, getUserId }}
 */
function getUserEngine(userId = "default") {
  const uid = String(userId || "default").trim();

  function getPortfolioSnapshot() {
    return Object.freeze({
      timestamp: Date.now(),
      userId:    uid,
      positions: loadHoldings(uid),
    });
  }

  async function addHolding({ symbol, qty, cost }) {
    if (!Number.isFinite(qty)  || qty  <= 0) throw new Error("INVALID_QTY");
    if (!Number.isFinite(cost) || cost <= 0) throw new Error("INVALID_COST");

    const holdings = loadHoldings(uid);
    const s = await resolveIfNew(symbol, holdings);
    const h = holdings.find(x => x.symbol === s);

    if (h) {
      h.qty            += qty;
      h.totalCostBasis += cost;
    } else {
      holdings.push({
        symbol:         s,
        qty,
        totalCostBasis: cost,
        assetClass:     "equity",
        currency:       "USD",
        addedAt:        new Date().toISOString(),
      });
    }

    persistHoldings(uid, holdings);
    return getPortfolioSnapshot();
  }

  async function updateHolding({ symbol, qtyDelta }) {
    if (!Number.isFinite(qtyDelta) || qtyDelta === 0)
      throw new Error("INVALID_QTY_DELTA");

    const holdings = loadHoldings(uid);
    const s = String(symbol).toUpperCase();
    const h = holdings.find(x => x.symbol === s);

    if (!h) throw new Error("HOLDING_NOT_FOUND");

    const avgCost = h.totalCostBasis / h.qty;
    const newQty  = h.qty + qtyDelta;

    if (newQty < 0) throw new Error("QTY_EXCEEDS_HOLDING");

    if (newQty === 0) {
      persistHoldings(uid, holdings.filter(x => x.symbol !== s));
      return getPortfolioSnapshot();
    }

    if (qtyDelta < 0) {
      h.totalCostBasis += avgCost * qtyDelta; // qtyDelta is negative
    }

    h.qty        = newQty;
    h.updatedAt  = new Date().toISOString();
    persistHoldings(uid, holdings);
    return getPortfolioSnapshot();
  }

  async function removeHolding({ symbol }) {
    const s        = String(symbol).toUpperCase();
    const holdings = loadHoldings(uid);
    persistHoldings(uid, holdings.filter(x => x.symbol !== s));
    return getPortfolioSnapshot();
  }

  /**
   * Returns all holdings as a plain array. Useful for passing
   * to downstream engines (discovery, Kelly, risk).
   */
  function getPositions() {
    return loadHoldings(uid);
  }

  /**
   * Returns the user's symbol list. Used by discoveryThemeOrchestrator
   * to scope theme results to this user's portfolio.
   */
  function getSymbolList() {
    return loadHoldings(uid).map(h => h.symbol);
  }

  /**
   * Replaces all holdings atomically. Used for bulk import / onboarding.
   * @param {{ symbol, qty, cost, assetClass?, currency? }[]} positions
   */
  async function setAllHoldings(positions) {
    if (!Array.isArray(positions)) throw new Error("INVALID_POSITIONS");

    const resolved = await Promise.all(
      positions.map(async (p) => {
        const s = String(p.symbol || "").toUpperCase();
        return {
          symbol:         s,
          qty:            Number(p.qty)            || 0,
          totalCostBasis: Number(p.cost)           || 0,
          assetClass:     p.assetClass             || "equity",
          currency:       p.currency               || "USD",
          addedAt:        p.addedAt                || new Date().toISOString(),
        };
      })
    );

    persistHoldings(uid, resolved.filter(p => p.qty > 0));
    return getPortfolioSnapshot();
  }

  return Object.freeze({
    getUserId:           () => uid,
    getPortfolioSnapshot,
    addHolding,
    updateHolding,
    removeHolding,
    getPositions,
    getSymbolList,
    setAllHoldings,
  });
}

// ─── Default engine (userId = "default") ─────────────────────────────────────
// Backward-compatible: all existing IPC handlers that call these functions
// directly continue to work with zero changes.

const _defaultEngine = getUserEngine("default");

const getPortfolioSnapshot = _defaultEngine.getPortfolioSnapshot;
const addHolding           = _defaultEngine.addHolding;
const updateHolding        = _defaultEngine.updateHolding;
const removeHolding        = _defaultEngine.removeHolding;

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = Object.freeze({
  // Multi-user factory
  getUserEngine,

  // Default single-user API — UNCHANGED, all existing code works
  getPortfolioSnapshot,
  addHolding,
  updateHolding,
  removeHolding,
});
