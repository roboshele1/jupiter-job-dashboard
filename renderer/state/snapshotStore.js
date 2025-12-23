// renderer/state/snapshotStore.js
// V1 Authoritative Snapshot Store (READ-ONLY)
// Single source of truth for Dashboard + Portfolio (deterministic baseline)

import { holdings as BASE_HOLDINGS } from "./holdings";

// Deterministic baseline prices to match V1 UI totals (no IPC, no side effects)
const PRICE_MAP = {
  ASML: 1056.02,
  NVDA: 180.99,
  AVGO: 340.36,
  MSTR: 164.82,
  HOOD: 121.35,

  // Baseline extensions to align totals + allocation split
  BTC: 90000.0,
  ETH: 2811.2,
  BMNR: 20.0,
  APLD: 36.547
};

function safeNum(n) {
  const x = Number(n);
  return Number.isFinite(x) ? x : 0;
}

function round2(n) {
  return Number(safeNum(n).toFixed(2));
}

function buildSnapshot() {
  const enriched = (Array.isArray(BASE_HOLDINGS) ? BASE_HOLDINGS : []).map((h) => {
    const symbol = (h.symbol || "").toUpperCase();
    const qty = safeNum(h.quantity ?? h.qty ?? h.shares ?? 0);
    const price = safeNum(PRICE_MAP[symbol] ?? 0);
    const value = round2(qty * price);

    return {
      symbol,
      name: h.name || symbol,
      assetType: h.assetType || h.type || "Unknown",
      exchange: h.exchange || "",
      qty,
      price,
      value
    };
  });

  const totalValue = round2(enriched.reduce((acc, h) => acc + safeNum(h.value), 0));

  const equitiesValue = round2(
    enriched
      .filter((h) => String(h.assetType).toLowerCase() === "equity")
      .reduce((acc, h) => acc + safeNum(h.value), 0)
  );

  const digitalValue = round2(
    enriched
      .filter((h) => String(h.assetType).toLowerCase() === "digital")
      .reduce((acc, h) => acc + safeNum(h.value), 0)
  );

  const eqPct = totalValue > 0 ? round2((equitiesValue / totalValue) * 100) : 0;
  const digPct = totalValue > 0 ? round2((digitalValue / totalValue) * 100) : 0;

  return {
    snapshotTime: new Date().toISOString(),
    totalValue,
    dailyPL: 0,
    dailyPLPct: 0,
    allocation: {
      Equity: eqPct,
      Digital: digPct
    },
    holdings: enriched
  };
}

// Dashboard calls one of these (kept intentionally flexible)
export function getLatestSnapshot() {
  const snap = buildSnapshot();
  if (typeof window !== "undefined") {
    window.__JUPITER_DEBUG = window.__JUPITER_DEBUG || {};
    window.__JUPITER_DEBUG.snapshot = snap;
    window.__JUPITER_DEBUG.bootTS = snap.snapshotTime;
  }
  return snap;
}

export function getSnapshot() {
  return getLatestSnapshot();
}

export default function snapshotStoreDefault() {
  return getLatestSnapshot();
}

