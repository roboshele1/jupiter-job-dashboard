// engine/marketMonitorEngine.js
// LIVE Market Monitor — Full market intelligence
// Equities (SPY, QQQ, VIX proxy), Crypto (BTC, ETH), Sector breadth
// Read-only. Deterministic.

import { getPrices } from "./priceService.js";
import fetch from "node-fetch";

const POLYGON_KEY = process.env.POLYGON_API_KEY || "jyA2YblY5AP7pkvNtyBhpfTNQcSczcAS";

let lastSnapshot = null;

async function fetchPolygonPrev(symbol) {
  try {
    const res = await fetch(
      `https://api.polygon.io/v2/aggs/ticker/${symbol}/prev?adjusted=true&apiKey=${POLYGON_KEY}`,
      { timeout: 6000 }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data?.results?.[0] ?? null;
  } catch {
    return null;
  }
}

// Derive VIX proxy from SPY daily range — (high-low)/close is a volatility measure
function computeVixProxy(bar) {
  if (!bar || !bar.c) return null;
  return Math.round(((bar.h - bar.l) / bar.c) * 1000) / 10; // as percentage
}

// Breadth proxy: % of major sector ETFs above their open (8 sectors)
async function computeBreadthProxy() {
  const sectorETFs = ["XLK", "XLF", "XLV", "XLE", "XLI", "XLP", "XLU", "XLRE"];
  const bars = await Promise.all(sectorETFs.map(s => fetchPolygonPrev(s)));
  const aboveOpen = bars.filter(b => b && b.c > b.o).length;
  return Math.round((aboveOpen / sectorETFs.length) * 100);
}

export async function getMarketMonitorSnapshot() {
  // Fetch all in parallel
  const [cryptoPrices, spyBar, qqqBar, iwmBar, breadthPct] = await Promise.all([
    getPrices(["BTC", "ETH"]),
    fetchPolygonPrev("SPY"),
    fetchPolygonPrev("QQQ"),
    fetchPolygonPrev("IWM"),
    computeBreadthProxy(),
  ]);

  const spyMomentum  = spyBar ? ((spyBar.c - spyBar.o) / spyBar.o) * 100 : null;
  const qqqMomentum  = qqqBar ? ((qqqBar.c - qqqBar.o) / qqqBar.o) * 100 : null;
  const vixProxy     = computeVixProxy(spyBar);

  // Regime signal: derived from breadth + momentum, no hardcoded opinions
  let regimeSignal = "NEUTRAL";
  if (breadthPct !== null && spyMomentum !== null) {
    if (breadthPct >= 65 && spyMomentum > 0)        regimeSignal = "RISK_ON";
    else if (breadthPct <= 40 && spyMomentum < 0)   regimeSignal = "RISK_OFF";
    else if (breadthPct >= 55)                       regimeSignal = "MILD_RISK_ON";
    else if (breadthPct <= 45)                       regimeSignal = "MILD_RISK_OFF";
  }

  lastSnapshot = {
    timestamp: new Date().toISOString(),
    assets: {
      BTC: cryptoPrices.BTC,
      ETH: cryptoPrices.ETH,
    },
    indices: {
      SPY: spyBar ? { price: spyBar.c, momentum: Math.round(spyMomentum * 100) / 100 } : null,
      QQQ: qqqBar ? { price: qqqBar.c, momentum: Math.round(qqqMomentum * 100) / 100 } : null,
      IWM: iwmBar ? { price: iwmBar.c, momentum: Math.round(((iwmBar.c - iwmBar.o) / iwmBar.o) * 10000) / 100 } : null,
    },
    breadth: {
      sectorPctAboveOpen: breadthPct,
    },
    volatility: {
      vixProxy,
    },
    regime: {
      signal:   regimeSignal,
      basis:    `breadth=${breadthPct}% · SPY momentum=${spyMomentum?.toFixed(2)}%`,
    },
  };

  return lastSnapshot;
}

export function getLastMarketMonitorSnapshot() {
  return lastSnapshot;
}
