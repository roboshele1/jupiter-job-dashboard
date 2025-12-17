// engine/equitiesEngine.js
// CANONICAL equities snapshot — no missing exports, no indirection

const https = require("https");

const HOLDINGS = [
  { symbol: "ASML", shares: 10 },
  { symbol: "NVDA", shares: 73 },
  { symbol: "AVGO", shares: 80 },
  { symbol: "MSTR", shares: 25 },
  { symbol: "HOOD", shares: 35 },
  { symbol: "BMNR", shares: 115 },
  { symbol: "APLD", shares: 150 }
];

function fetchYahooPrice(symbol) {
  const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbol}`;

  return new Promise(resolve => {
    https.get(url, res => {
      let data = "";
      res.on("data", c => (data += c));
      res.on("end", () => {
        try {
          const json = JSON.parse(data);
          const price =
            json.quoteResponse.result[0]?.regularMarketPrice ?? null;
          resolve(price);
        } catch {
          resolve(null);
        }
      });
    }).on("error", () => resolve(null));
  });
}

async function getEquitiesSnapshot() {
  const positions = [];
  let totalValue = 0;

  for (const h of HOLDINGS) {
    const price = await fetchYahooPrice(h.symbol);
    const value = price ? +(price * h.shares).toFixed(2) : 0;

    totalValue += value;

    positions.push({
      symbol: h.symbol,
      quantity: h.shares,
      price,
      value
    });
  }

  return {
    positions,
    totalValue: +totalValue.toFixed(2)
  };
}

module.exports = {
  getEquitiesSnapshot
};

