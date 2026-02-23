/**
 * JUPITER — Portfolio Store (Authoritative Source)
 * Reads live from holdings.json — no hardcoded positions.
 * UI, Risk, Growth, Discovery, Analytics all consume this state.
 */

import fs   from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const HOLDINGS_PATH = path.resolve(
  __dirname, "./data/users/default/holdings.json"
);

function loadHoldings() {
  try {
    const raw    = fs.readFileSync(HOLDINGS_PATH, "utf-8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error("[portfolioStore] Failed to read holdings.json:", err.message);
    return [];
  }
}

function buildPortfolio() {
  const holdings = loadHoldings();

  const assets = holdings.map((h, i) => {
    const symbol     = (h.symbol || "").toUpperCase();
    const assetClass = (h.assetClass || "equity").toUpperCase();
    const isCrypto   = assetClass === "CRYPTO";

    return Object.freeze({
      type:     isCrypto ? "CRYPTO" : "EQUITY",
      symbol,
      exchange: h.exchange || (isCrypto ? null : "XNAS"),
      shares:   h.qty ?? h.quantity ?? 0,
      quantity: h.qty ?? h.quantity ?? 0,
      totalCostBasis: h.totalCostBasis ?? 0,
      currency: h.currency || "USD",
      priority: i + 1,
    });
  });

  return Object.freeze({
    metadata: Object.freeze({
      owner:       "PRIMARY_USER",
      baseCurrency: "CAD",
      lastUpdated: new Date().toISOString(),
      version:     "LIVE",
    }),
    assets,
  });
}

// Re-read from disk on every access so additions/removals are reflected immediately
export function getPortfolio() {
  return buildPortfolio();
}

// Legacy PORTFOLIO export for any consumers that import it directly
export const PORTFOLIO = buildPortfolio();
