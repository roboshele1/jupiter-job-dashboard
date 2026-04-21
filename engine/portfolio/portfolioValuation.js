import 'dotenv/config';
import { getCostBasis } from "./portfolioCostBasis.js";

// engine/portfolio/portfolioValuation.js
// D9.5 — Portfolio valuation + cost-basis authority + canonical market data snapshot
// Deterministic, read-only, append-only evolution

import { resolvePrices } from "../market/priceResolver.js";
import { applyPriceFreshness } from "../market/priceFreshnessEngine.js";
import { fetchHistoricalMarketData } from "../market/marketDataSnapshotEngine.js";

let _cadUsdRate = null;
let _cadUsdFetchedAt = 0;
async function getCadUsdRate() {
  const now = Date.now();
  if (_cadUsdRate && now - _cadUsdFetchedAt < 3600_000) return _cadUsdRate;
  try {
    const res = await fetch("https://api.frankfurter.app/latest?from=CAD&to=USD");
    const json = await res.json();
    const rate = json?.rates?.USD;
    if (rate) { _cadUsdRate = rate; _cadUsdFetchedAt = now; return rate; }
  } catch(e) {}
  return _cadUsdRate || 0.74;
}

/**
 * 🔒 AUTHORITATIVE PORTFOLIO SNAPSHOT
 * - Existing valuation logic preserved
 * - Cost basis authority injected
 * - Market data appended (non-breaking)
 * - Deterministic, read-only
 */
export async function valuePortfolio(holdings = []) {
  if (!Array.isArray(holdings)) holdings = [];

  const hasTSX = holdings.some(h => String(h.symbol).endsWith(".TO") || String(h.symbol).endsWith(".TSX"));
  const cadUsdRate = hasTSX ? await getCadUsdRate() : null;

  const resolverInput = holdings.map(h => ({
    symbol: h.symbol,
    type: h.assetClass === "crypto" ? "crypto" : "equity"
  }));

  // =========================
  // PRICE SNAPSHOT (EXISTING)
  // =========================
  const resolved = await resolvePrices(resolverInput);

  // 🔒 Apply freshness ONCE at engine boundary
  const enrichedSnapshot = applyPriceFreshness(resolved);

  const positions = holdings.map(h => {
    const r = enrichedSnapshot.prices?.[h.symbol] ?? {
      price: 0,
      source: "unknown",
      currency: h.currency ?? "CAD",
      freshness: null
    };

    const rawPrice = Number(r.price) || 0;
    const priceCurrency = r.currency ?? "USD";
    const livePrice = (priceCurrency === "CAD" && cadUsdRate) ? rawPrice * cadUsdRate : rawPrice;

    // 🔒 COST BASIS AUTHORITY (single source of truth)
    const totalCostBasis = Number(h.totalCostBasis) || 0;

    const qty = Number(h.qty) || Number(h.quantity) || 0;

    const liveValue = qty * livePrice;
    const delta = liveValue - totalCostBasis;
    const deltaPct =
      totalCostBasis > 0 ? (delta / totalCostBasis) * 100 : 0;

    return {
      symbol: h.symbol,
      qty,
      assetClass: h.assetClass,
      totalCostBasis,
      snapshotValue: totalCostBasis,
      livePrice,
      liveValue,
      delta,
      deltaPct,
      currency: r.currency ?? "CAD",
      priceSource: r.source,
      priceFreshness: r.freshness
    };
  });

  const totals = positions.reduce(
    (acc, p) => {
      acc.snapshotValue += p.snapshotValue;
      acc.liveValue += p.liveValue;
      acc.delta += p.delta;
      return acc;
    },
    { snapshotValue: 0, liveValue: 0, delta: 0 }
  );

  totals.deltaPct =
    totals.snapshotValue > 0
      ? (totals.delta / totals.snapshotValue) * 100
      : 0;

  // =========================
  // 🟢 APPENDED: MARKET DATA
  // =========================
  const symbols = positions.map(p => p.symbol);
  const marketData = await fetchHistoricalMarketData(symbols);

  return {
    contract: "PORTFOLIO_VALUATION_DETERMINISTIC_V3",
    currency: "CAD",
    fetchedAt: enrichedSnapshot.fetchedAt,

    totals,
    positions,

    // ⬇️ SAFE APPEND
    marketData: Object.freeze(marketData),

    priceSnapshotMeta: {
      contract: enrichedSnapshot.contract,
      source: enrichedSnapshot.source,
      fetchedAt: enrichedSnapshot.fetchedAt
    }
  };
}
