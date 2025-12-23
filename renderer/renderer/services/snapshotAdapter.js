// renderer/services/snapshotAdapter.js
// Phase 5 — Snapshot Adapter (read-only, live-price aware)
// Contract-safe adapter consumed by Dashboard, Chat, Insights

import { fetchLivePrices } from "./livePriceSource";
import { getPortfolioSummary, getPortfolioAllocation } from "./portfolioSnapshot";
import { valueHoldings } from "../engine/valueEngine";

// NOTE:
// - holdings source is already canonical (Portfolio tab)
// - this adapter only enriches with live prices
// - no mutations, no writes, no IPC

export async function buildSnapshot(holdings = []) {
  if (!Array.isArray(holdings) || holdings.length === 0) {
    return {
      meta: {
        source: "snapshot",
        hydrated: false,
        timestamp: null
      },
      summary: null,
      allocation: null,
      holdings: []
    };
  }

  const symbols = holdings.map(h => h.symbol);
  const livePricePayload = await fetchLivePrices(symbols);

  const valuedHoldings = valueHoldings(
    holdings,
    livePricePayload.prices
  );

  return {
    meta: {
      source: livePricePayload.source,
      hydrated: true,
      timestamp: livePricePayload.timestamp
    },
    summary: getPortfolioSummary(valuedHoldings),
    allocation: getPortfolioAllocation(valuedHoldings),
    holdings: valuedHoldings
  };
}

