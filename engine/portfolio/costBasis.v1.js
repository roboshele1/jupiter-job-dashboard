// engine/portfolio/costBasis.v1.js
// AUTHORITATIVE COST BASIS — V1.1 (USER PROVIDED, LOCKED)
//
// Rules:
// - Costs are TOTAL cost per asset
// - Currency is explicit per asset
// - BTC = CAD
// - ETH = USD
// - Equities = USD
// - This file is immutable once frozen

export const COST_BASIS_V1 = {
  equities: {
    NVDA: { cost: 12881.13, currency: "USD" },
    ASML: { cost: 8649.52, currency: "USD" },
    AVGO: { cost: 26190.68, currency: "USD" },
    MSTR: { cost: 12496.18, currency: "USD" },
    HOOD: { cost: 3316.68, currency: "USD" },
    BMNR: { cost: 6320.18, currency: "USD" },
    APLD: { cost: 1615.58, currency: "USD" }
  },
  crypto: {
    BTC: { cost: 24764.31, currency: "CAD" },
    ETH: { cost: 436.11, currency: "USD" }
  },
  meta: {
    version: "V1.1",
    authority: "USER_PROVIDED_COST_BASIS",
    locked: true
  }
};

export default COST_BASIS_V1;

