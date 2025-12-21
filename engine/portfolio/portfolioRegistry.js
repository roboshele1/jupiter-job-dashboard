// engine/portfolio/portfolioRegistry.js
// JUPITER — Portfolio Registry (AUTHORITATIVE, IN-MEMORY)

const _positions = [
  { symbol: "ASML", quantity: 10, avgCost: 864.17, source: "equity" },
  { symbol: "NVDA", quantity: 73, avgCost: 176.45, source: "equity" },
  { symbol: "AVGO", quantity: 80, avgCost: 327.38, source: "equity" },
  { symbol: "MSTR", quantity: 25, avgCost: 312.4, source: "equity" },
  { symbol: "HOOD", quantity: 35, avgCost: 94.76, source: "equity" },
  { symbol: "BMNR", quantity: 115, avgCost: 38.3, source: "equity" },
  { symbol: "APLD", quantity: 150, avgCost: 14.69, source: "equity" },
  { symbol: "BTC", quantity: 0.251083, avgCost: 118180.22, source: "crypto" },
  { symbol: "ETH", quantity: 0.25, avgCost: null, source: "crypto" },
];

export const portfolioRegistry = {
  getAll() {
    return [..._positions];
  },
};

