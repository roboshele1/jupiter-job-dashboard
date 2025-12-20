// engine/portfolioSource.js
// Canonical holdings source (v1)

const equities = [
  { symbol: "NVDA", qty: 73 },
  { symbol: "AVGO", qty: 74 },
  { symbol: "ASML", qty: 10 },
  { symbol: "HOOD", qty: 70 },
  { symbol: "MSTR", qty: 24 },
  { symbol: "APLD", qty: 150 },
  { symbol: "BMNR", qty: 115 }
];

const crypto = [
  { symbol: "BTC", qty: 0.251 }
];

function getHoldings() {
  return {
    equities,
    crypto
  };
}

module.exports = { getHoldings };

