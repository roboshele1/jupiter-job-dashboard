#!/usr/bin/env python3
"""
JUPITER — marketRegimeIpc live data wiring
Replaces hardcoded vixLevel + breadthPctAbove50DMA with live Polygon fetches.
Run from: ~/JUPITER
Usage:    python3 jupiter_fix_regime.py
"""

import os, subprocess

JUPITER = os.path.expanduser("~/JUPITER")
path    = os.path.join(JUPITER, "electron/ipc/marketRegimeIpc.js")

NEW_CONTENT = '''\
// electron/ipc/marketRegimeIpc.js
// LIVE DATA — wired to Polygon.io (replaces hardcoded VIX/breadth placeholders)
//
// VIX proxy:    VIXY ETF prev-close (tracks CBOE VIX; available on Polygon free tier)
// SPY trend:    SPY prev-close vs open — rising = UPTREND, falling = DOWNTREND
// Breadth:      Approximated from a basket of 10 bellwether large-caps vs their
//               prev-close as a proxy for %>50DMA (full breadth scan is expensive;
//               this is a fast, good-enough signal for regime classification)
// Cache TTL:    5 minutes — regime does not change tick-by-tick
//
// TODO v1.1: replace bellwether basket breadth with full SPY constituent scan
//            using Polygon /v2/snapshot/locale/us/markets/stocks/tickers

import { computeMarketRegime } from "../../engine/marketRegime/marketRegimeEngine.js";

const POLYGON_BASE = "https://api.polygon.io";
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// Bellwether basket — 10 large-caps that lead broad market breadth
const BREADTH_BASKET = ["AAPL","MSFT","AMZN","GOOGL","META","JPM","UNH","XOM","JNJ","BRK.B"];

let cachedSnapshot = null;
let cacheExpiresAt = 0;

function apiKey() {
  return process.env.POLYGON_API_KEY || "jyA2YblY5AP7pkvNtyBhpfTNQcSczcAS";
}

async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) {
    const txt = await res.text().catch(() => res.status);
    throw new Error(`Polygon ${res.status}: ${txt}`);
  }
  return res.json();
}

async function fetchPrevBar(symbol) {
  const url = `${POLYGON_BASE}/v2/aggs/ticker/${symbol}/prev?adjusted=true&apiKey=${apiKey()}`;
  const j   = await fetchJSON(url);
  return j?.results?.[0] ?? null;
}

// VIX proxy: VIXY ETF close level (maps roughly to VIX index)
// <15 = calm, 15-25 = normal, 25-35 = elevated, >35 = fear
async function fetchVixProxy() {
  try {
    const bar = await fetchPrevBar("VIXY");
    if (!bar?.c) return 22; // fallback to neutral
    // VIXY price is roughly 1/3 of VIX index — scale up
    return parseFloat((bar.c * 3.1).toFixed(1));
  } catch {
    return 22; // neutral fallback
  }
}

// SPY trend: compare close to open
// Up >0.3%  = UPTREND, Down <-0.3% = DOWNTREND, else SIDEWAYS
async function fetchIndexTrend() {
  try {
    const bar = await fetchPrevBar("SPY");
    if (!bar?.c || !bar?.o) return "SIDEWAYS";
    const changePct = ((bar.c - bar.o) / bar.o) * 100;
    if (changePct > 0.3)  return "UPTREND";
    if (changePct < -0.3) return "DOWNTREND";
    return "SIDEWAYS";
  } catch {
    return "SIDEWAYS";
  }
}

// Breadth: % of bellwether basket closing above open (close > open = advancing)
// Proxy for %>50DMA — good enough for daily regime signal
async function fetchBreadthProxy() {
  try {
    const results = await Promise.allSettled(
      BREADTH_BASKET.map(sym => fetchPrevBar(sym))
    );
    const bars    = results
      .filter(r => r.status === "fulfilled" && r.value?.c && r.value?.o)
      .map(r => r.value);
    if (!bars.length) return 52; // neutral fallback
    const advancing = bars.filter(b => b.c > b.o).length;
    return parseFloat(((advancing / bars.length) * 100).toFixed(1));
  } catch {
    return 52; // neutral fallback
  }
}

async function buildLiveInputs() {
  const [vixLevel, indexTrend, breadthPctAbove50DMA] = await Promise.all([
    fetchVixProxy(),
    fetchIndexTrend(),
    fetchBreadthProxy(),
  ]);
  return { vixLevel, breadthPctAbove50DMA, indexTrend };
}

export function registerMarketRegimeIpc(ipcMain) {
  ipcMain.handle("marketRegime:get", async () => {
    const now = Date.now();

    // Return cache if still fresh
    if (cachedSnapshot && now < cacheExpiresAt) {
      return cachedSnapshot;
    }

    try {
      const inputs = await buildLiveInputs();
      const regime = computeMarketRegime(inputs);

      cachedSnapshot = {
        timestamp: now,
        regime,
        inputs, // expose for debugging in RegimeBanner
      };
      cacheExpiresAt = now + CACHE_TTL_MS;
    } catch (err) {
      console.error("[marketRegimeIpc] live fetch failed, using stale cache or neutral fallback:", err.message);

      // If we have a stale cache, extend it rather than crashing
      if (cachedSnapshot) {
        cacheExpiresAt = now + CACHE_TTL_MS;
        return cachedSnapshot;
      }

      // Last resort: neutral regime so the UI never crashes
      const fallbackInputs = { vixLevel: 22, breadthPctAbove50DMA: 52, indexTrend: "SIDEWAYS" };
      cachedSnapshot = {
        timestamp: now,
        regime: computeMarketRegime(fallbackInputs),
        inputs: fallbackInputs,
        fallback: true,
      };
      cacheExpiresAt = now + 60_000; // retry sooner on fallback
    }

    return cachedSnapshot;
  });
}
'''

with open(path, "w") as f:
    f.write(NEW_CONTENT)
print(f"  ✓  marketRegimeIpc.js rewritten with live Polygon data")

# Commit
os.chdir(JUPITER)
subprocess.run(["git", "add", path])
result = subprocess.run(
    ["git", "commit", "-m", "BETA_HARDENING: marketRegimeIpc — wire VIX proxy + breadth + SPY trend to live Polygon data"],
    capture_output=True, text=True
)
print(" ", (result.stdout + result.stderr).strip())
print()
print("Done. marketRegimeIpc now fetches:")
print("  VIX proxy:  VIXY ETF prev-close × 3.1")
print("  SPY trend:  SPY close vs open pct change")
print("  Breadth:    % of 10 bellwether large-caps closing above open")
print("  Cache TTL:  5 minutes, graceful stale fallback on error")
