/**
 * JUPITER — Portfolio Read Snapshot V1
 * -----------------------------------
 * Canonical READ contract for the entire application.
 *
 * RULES:
 * - Engine-only
 * - No IPC
 * - No renderer
 * - No Electron
 * - Deterministic
 * - Frozen output
 *
 * ALL TABS must eventually read from THIS contract.
 */

import { valuePortfolio } from "./portfolioValuation.js";
import engine from "./portfolioEngine.js";

/**
 * Build the authoritative read snapshot.
 */
export async function getPortfolioReadSnapshotV1() {
  // 1️⃣ Read canonical holdings (qty only)
  const rawSnapshot = engine.getPortfolioSnapshot();
  const holdings = Array.isArray(rawSnapshot?.positions)
    ? rawSnapshot.positions
    : [];

  // 2️⃣ Normalize for valuation layer
  const valuationInput = holdings.map(h => ({
    symbol: h.symbol,
    qty: h.qty,
    assetClass: ["BTC", "ETH"].includes(h.symbol) ? "crypto" : "equity",
    totalCostBasis: 0 // placeholder until cost basis contract is unified
  }));

  // 3️⃣ Value portfolio (pricing + freshness + totals)
  const valuation = await valuePortfolio(valuationInput);

  // 4️⃣ Emit frozen, canonical read snapshot
  return Object.freeze({
    contract: "PORTFOLIO_READ_SNAPSHOT_V1",
    asOf: Date.now(),
    holdings: Object.freeze([...holdings]),
    valuation: Object.freeze(valuation)
  });
}
