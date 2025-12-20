// engine/portfolio/holdingsRegistry.js
// AUTHORITATIVE PORTFOLIO HOLDINGS — V1
// Editable quantities, fixed schema

export const HOLDINGS_REGISTRY = {
  ASML: {
    quantity: 10,
    avgCost: 864.17,
    type: "equity"
  },
  NVDA: {
    quantity: 73,
    avgCost: 176.45,
    type: "equity"
  },
  AVGO: {
    quantity: 80,
    avgCost: 327.38,
    type: "equity"
  },
  MSTR: {
    quantity: 25,
    avgCost: 312.40,
    type: "equity"
  },
  HOOD: {
    quantity: 35,
    avgCost: 94.76,
    type: "equity"
  },
  BMNR: {
    quantity: 115,
    avgCost: 38.30,
    type: "equity"
  },
  APLD: {
    quantity: 150,
    avgCost: 14.69,
    type: "equity"
  },
  BTC: {
    quantity: 0.251083,
    avgCost: 118180.22,
    type: "crypto"
  },
  ETH: {
    quantity: 0.25,
    avgCost: null, // intentionally unknown for now
    type: "crypto"
  }
};

