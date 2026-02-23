/**
 * PORTFOLIO_AUTHORITY_V1
 * Single authoritative portfolio provider for the engine layer.
 * Reads live from holdings.json — never hardcoded.
 *
 * RULES:
 * - Engine-only
 * - No Electron
 * - No IPC
 * - Deterministic
 */

import fs   from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const HOLDINGS_PATH = path.resolve(
  __dirname, "../data/users/default/holdings.json"
);

export async function getAuthoritativePortfolio() {
  let holdings = [];

  try {
    const raw = fs.readFileSync(HOLDINGS_PATH, "utf-8");
    const parsed = JSON.parse(raw);
    holdings = Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error("[portfolioAuthority] Failed to read holdings.json:", err.message);
  }

  // Normalise field names — holdings.json uses qty, engine expects quantity/totalCostBasis
  const normalised = holdings.map(h => ({
    symbol:         (h.symbol || "").toUpperCase(),
    quantity:       h.qty ?? h.quantity ?? 0,
    qty:            h.qty ?? h.quantity ?? 0,
    assetClass:     h.assetClass || "equity",
    totalCostBasis: h.totalCostBasis ?? 0,
    currency:       h.currency || "USD",
  }));

  return Object.freeze({
    contract: "PORTFOLIO_AUTHORITY_V1",
    currency: "CAD",
    holdings: normalised,
  });
}
