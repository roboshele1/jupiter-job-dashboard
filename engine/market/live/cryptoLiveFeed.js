/**
 * engine/market/live/cryptoLiveFeed.js
 * NON-THROWING crypto feed (Coinbase)
 */

import fetch from "node-fetch";

export async function getCryptoPrices() {
  try {
    const pairs = {
      BTC: "BTC-USD",
      ETH: "ETH-USD"
    };

    const results = {};

    for (const [symbol, pair] of Object.entries(pairs)) {
      const res = await fetch(
        `https://api.exchange.coinbase.com/products/${pair}/ticker`
      );

      const json = await res.json();
      const price = Number(json?.price);

      if (!isNaN(price)) {
        results[symbol] = {
          price,
          source: "coinbase"
        };
      }
    }

    return results;
  } catch {
    return {};
  }
}

