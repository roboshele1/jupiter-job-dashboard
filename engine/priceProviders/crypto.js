// engine/priceProviders/crypto.js
// Deterministic crypto price provider (Coinbase spot)

const https = require("https");

function fetchPrice(symbol) {
  const pair = `${symbol}-USD`;
  const url = `https://api.coinbase.com/v2/prices/${pair}/spot`;

  return new Promise((resolve) => {
    https
      .get(url, (res) => {
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => {
          try {
            const json = JSON.parse(data);
            const price = parseFloat(json?.data?.amount);
            resolve(isNaN(price) ? null : price);
          } catch {
            resolve(null);
          }
        });
      })
      .on("error", () => resolve(null));
  });
}

async function getCryptoPrices(symbols = []) {
  const out = {};
  for (const s of symbols) {
    const p = await fetchPrice(s);
    if (p !== null) out[s] = p;
  }
  return out;
}

module.exports = {
  getCryptoPrices
};

