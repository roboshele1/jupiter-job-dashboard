// renderer/services/livePriceSource.js
// Live market price source (read-only)
// Phase 5 — hydration layer

import axios from "axios";

const POLYGON_API_KEY = "jyA2YblY5AP7pkvNtyBhpfTNQcSczcAS";

export async function fetchLivePrices(symbols = []) {
  const prices = {};

  for (const symbol of symbols) {
    // Crypto via Coinbase
    if (symbol === "BTC" || symbol === "ETH") {
      const res = await axios.get(
        `https://api.coinbase.com/v2/prices/${symbol}-USD/spot`
      );

      prices[symbol] = {
        price: Number(res.data?.data?.amount),
        currency: "USD",
      };

      continue;
    }

    // Equities via Polygon (previous close)
    const res = await axios.get(
      `https://api.polygon.io/v2/aggs/ticker/${symbol}/prev`,
      { params: { apiKey: POLYGON_API_KEY } }
    );

    prices[symbol] = {
      price: res.data?.results?.[0]?.c ?? null,
      currency: "USD",
    };
  }

  return {
    source: "live",
    timestamp: new Date().toISOString(),
    prices,
  };
}

