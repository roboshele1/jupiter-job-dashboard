/**
 * JUPITER v1 — Price Service
 * Canonical price resolver for crypto and equities.
 * No UI access. No guessing. Deterministic.
 */

const https = require("https");

/* =======================
   INTERNAL HTTP FETCH
======================= */
function fetchJSON(url) {
  return new Promise((resolve) => {
    https
      .get(url, (res) => {
        let data = "";
        res.on("data", chunk => (data += chunk));
        res.on("end", () => {
          try {
            resolve(JSON.parse(data));
          } catch {
            resolve(null);
          }
        });
      })
      .on("error", () => resolve(null));
  });
}

/* =======================
   CRYPTO PRICES
======================= */
async function getCryptoPrices(symbols) {
  const prices = {};

  for (const symbol of symbols) {
    const pair = `${symbol}-USD`;
    const json = await fetchJSON(
      `https://api.coinbase.com/v2/prices/${pair}/spot`
    );

    const price = parseFloat(json?.data?.amount);
    if (!isNaN(price)) {
      prices[symbol] = price;
    }
  }

  return prices;
}

/* =======================
   EQUITY PRICES (v1)
======================= */
/**
 * Deterministic equity pricing for v1.
 * Replace with real broker/market adapter in v2.
 */
async function getEquityPrices(symbols) {
  const STATIC_PRICES = {
    NVDA: 878.16,
    AVGO: 1285.44,
    ASML: 742.33
  };

  const prices = {};
  for (const s of symbols) {
    prices[s] = STATIC_PRICES[s] ?? 0;
  }

  return prices;
}

module.exports = {
  getCryptoPrices,
  getEquityPrices
};

