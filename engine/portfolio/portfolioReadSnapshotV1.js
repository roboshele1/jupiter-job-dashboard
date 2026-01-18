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
 * ALL TABS must read from THIS contract.
 */

import { valuePortfolio } from "./portfolioValuation.js";
import holdingsAuthority from "../data/holdings.v4.authority.js";

/**
 * Build the authoritative read snapshot.
 */
export async function getPortfolioReadSnapshotV1() {
  // 1️⃣ Load canonical holdings authority (qty + cost basis)
  const holdings = Array.isArray(holdingsAuthority)
    ? holdingsAuthority
    : [];

  // 2️⃣ Validate + normalize for valuation engine
  const valuationInput = holdings.map(h => ({
    symbol: h.symbol,
    qty: Number(h.qty) || 0,
    assetClass: h.assetClass,
    totalCostBasis: Number(h.totalCostBasis) || 0,
    currency: h.currency || "CAD"
  }));

  // 3️⃣ Run valuation (pricing + freshness + totals)
  const valuation = await valuePortfolio(valuationInput);

  // 4️⃣ Emit frozen, canonical snapshot
  return Object.freeze({
    contract: "PORTFOLIO_READ_SNAPSHOT_V1",
    asOf: Date.now(),

    holdings: Object.freeze(
      valuationInput.map(h => Object.freeze({ ...h }))
    ),

    valuation: Object.freeze(valuation)
  });
}
