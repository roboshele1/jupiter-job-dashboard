// JUPITER Holdings Store — v1
// Canonical input source for portfolio holdings

const holdings = [
  { assetId: "BTC", assetType: "crypto", quantity: 0.251 },
  { assetId: "ETH", assetType: "crypto", quantity: 0.25 },
  { assetId: "NVDA", assetType: "equity", quantity: 73 },
  { assetId: "AVGO", assetType: "equity", quantity: 74 },
  { assetId: "ASML", assetType: "equity", quantity: 10 },
  { assetId: "MSTR", assetType: "equity", quantity: 24 },
  { assetId: "HOOD", assetType: "equity", quantity: 70 },
  { assetId: "BMNR", assetType: "equity", quantity: 115 },
  { assetId: "APLD", assetType: "equity", quantity: 150 }
];

function getHoldings() {
  return holdings.map(h => ({ ...h }));
}

module.exports = {
  getHoldings
};

