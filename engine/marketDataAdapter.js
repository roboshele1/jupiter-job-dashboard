/**
 * JUPITER — Live Market Data Adapter
 * Activation Phase A — Step 2
 *
 * Fetches real market prices from the authorized provider
 * using the locked configuration contract.
 */

import { MARKET_DATA_CONFIG } from "./marketDataConfig";

export async function fetchLivePrices(symbols = []) {
  if (!Array.isArray(symbols) || symbols.length === 0) {
    throw new Error("No symbols provided for live price fetch.");
  }

  const apiKey = import.meta.env[MARKET_DATA_CONFIG.auth.apiKeyEnvVar];
  if (!apiKey) {
    throw new Error("Missing Polygon API key in environment variables.");
  }

  const results = [];

  for (const symbol of symbols) {
    const url = `${MARKET_DATA_CONFIG.baseUrl}/v2/aggs/ticker/${symbol}/prev?adjusted=true&apiKey=${apiKey}`;

    const response = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch data for ${symbol}`);
    }

    const data = await response.json();

    if (
      !data ||
      !data.results ||
      !data.results[0] ||
      data.results[0].c === undefined
    ) {
      throw new Error(`Invalid price data received for ${symbol}`);
    }

    const price = data.results[0].c;

    if (
      MARKET_DATA_CONFIG.integrity.rejectZeroPrice &&
      price === 0
    ) {
      throw new Error(`Zero price rejected for ${symbol}`);
    }

    results.push({
      symbol,
      price,
      timestamp: Date.now(),
      source: MARKET_DATA_CONFIG.provider,
    });
  }

  return results;
}

/**
 * Adapter metadata
 */
export const MARKET_DATA_ADAPTER_META = Object.freeze({
  phase: "Activation Phase A",
  step: 2,
  live: true,
  executionSafe: true,
});

