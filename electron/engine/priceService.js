const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

/**
 * Canonical price service for V1
 * Returns plain numeric prices only (IPC-safe)
 */

async function getPrices() {
  const symbols = [
    "NVDA",
    "AVGO",
    "ASML",
    "MSTR",
    "HOOD",
    "APLD",
    "BMNR",
    "BTC",
    "ETH"
  ];

  const prices = {};

  // --- EQUITIES (stubbed for now, replace with live feed later) ---
  prices.NVDA = 170.94;
  prices.AVGO = 326.17;
  prices.ASML = 1015.86;
  prices.MSTR = 160.38;
  prices.HOOD = 115.80;
  prices.APLD = 21.97;
  prices.BMNR = 29.31;

  // --- CRYPTO (live CoinGecko) ---
  const cryptoRes = await fetch(
    "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd"
  );
  const crypto = await cryptoRes.json();

  prices.BTC = crypto.bitcoin.usd;
  prices.ETH = crypto.ethereum.usd;

  return prices;
}

module.exports = { getPrices };

