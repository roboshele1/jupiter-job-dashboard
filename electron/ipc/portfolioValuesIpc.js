/**
 * electron/ipc/portfolioValuesIpc.js
 * Fetches live prices and calculates current market values for all holdings
 */

import { ipcMain } from "electron";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const HOLDINGS_PATH = path.join(__dirname, "../../engine/data/users/default/holdings.json");
const POLYGON_KEY = process.env.POLYGON_API_KEY || 'YnaWTNmcXAkNMDpZTrFqpeLbvxisYOc3';

const CAGR_FALLBACK = {
  PLTR:45, APP:40, RKLB:38, AVGO:30, NVDA:28, NU:28,
  AXON:25, MELI:25, LLY:23, NOW:22, ZETA:21, BTC:20,
  ASML:15, ETH:15, MSTR:18,
};

async function fetchLivePrice(symbol) {
  try {
    const isCrypto = ['BTC', 'ETH'].includes(symbol.toUpperCase());
    let url;

    if (isCrypto) {
      const ticker = `X:${symbol.toUpperCase()}USD`;
      url = `https://api.polygon.io/v2/aggs/ticker/${ticker}/prev?adjusted=true&apiKey=${POLYGON_KEY}`;
    } else {
      url = `https://api.polygon.io/v2/aggs/ticker/${symbol.toUpperCase()}/prev?adjusted=true&apiKey=${POLYGON_KEY}`;
    }

    const resp = await fetch(url, { timeout: 5000 });
    if (!resp.ok) {
      console.warn(`[PORTFOLIO VALUES IPC] Price fetch failed for ${symbol}: ${resp.status}`);
      return null;
    }

    const data = await resp.json();
    const closePrice = data?.results?.[0]?.c;
    
    if (!closePrice) {
      console.warn(`[PORTFOLIO VALUES IPC] No price data for ${symbol}`);
      return null;
    }

    return closePrice;
  } catch (err) {
    console.error(`[PORTFOLIO VALUES IPC] fetchLivePrice(${symbol}) failed:`, err);
    return null;
  }
}

export function registerPortfolioValuesIpc() {
  ipcMain.handle("portfolio:get-market-values", async () => {
    try {
      const raw = fs.readFileSync(HOLDINGS_PATH, "utf-8");
      const holdings = JSON.parse(raw);

      if (!holdings || holdings.length === 0) {
        return { holdings: [], totalMarketValue: 0, blendedCAGR: null };
      }

      // Fetch all prices in parallel
      const pricePromises = holdings.map(h => fetchLivePrice(h.symbol));
      const prices = await Promise.all(pricePromises);

      // Calculate market values
      let totalMarketValue = 0;
      const enriched = holdings.map((h, idx) => {
        const price = prices[idx];
        const marketValue = h.qty * (price || 0);
        totalMarketValue += marketValue;

        return {
          symbol: h.symbol,
          qty: h.qty,
          livePrice: price,
          costBasis: h.totalCostBasis,
          marketValue: marketValue,
          expectedCagr: h.expectedCagr ?? CAGR_FALLBACK[h.symbol?.toUpperCase()] ?? 20,
        };
      });

      // Calculate blended CAGR by live market value
      const blendedCAGR = totalMarketValue > 0 ? enriched.reduce((s, h) => {
        const weight = h.marketValue / totalMarketValue;
        return s + (h.expectedCagr * weight);
      }, 0) : null;

      console.log(`[PORTFOLIO VALUES IPC] Total market value: $${totalMarketValue.toFixed(2)}, Blended CAGR: ${blendedCAGR != null ? blendedCAGR.toFixed(1) : "n/a"}%`);

      return {
        holdings: enriched,
        totalMarketValue,
        blendedCAGR,
      };
    } catch (err) {
      console.error("[PORTFOLIO VALUES IPC] Failed to get market values:", err);
      return { holdings: [], totalMarketValue: 0, blendedCAGR: null };
    }
  });

  console.log("[IPC] Portfolio values handler registered");
}

