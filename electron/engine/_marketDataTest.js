/**
 * _marketDataTest.js
 * -------------------
 * Manual smoke test for Polygon market data ingestion.
 * Run with: node engine/_marketDataTest.js
 */

require("dotenv").config();

const {
  fetchEquityPrice,
  fetchCryptoPrice,
} = require("./marketData");

async function run() {
  try {
    console.log("=== Market Data Smoke Test ===");

    console.log("\nFetching equity price: NVDA");
    const equity = await fetchEquityPrice("NVDA");
    console.log(equity);

    console.log("\nFetching crypto price: X:BTCUSD");
    const crypto = await fetchCryptoPrice("X:BTCUSD");
    console.log(crypto);

    console.log("\n✅ Market data ingestion SUCCESS");
  } catch (err) {
    console.error("\n❌ Market data ingestion FAILED");
    console.error(err.message);
  }
}

run();

