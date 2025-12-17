// JUPITER — Portfolio Store (Authoritative Source)
// Phase U — Step 1 FINAL
// This file represents the single source of truth for the user portfolio.
// UI, Risk, Growth, Discovery, Analytics, Automation all consume this state.
// Any change here propagates system-wide.

export const PORTFOLIO = {
  metadata: {
    owner: "PRIMARY_USER",
    baseCurrency: "CAD",
    lastUpdated: new Date().toISOString(),
    locked: true,
    version: "U1-FINAL"
  },

  assets: [
    {
      type: "EQUITY",
      symbol: "ASML",
      exchange: "XNAS",
      shares: 10,
      priority: 1
    },
    {
      type: "EQUITY",
      symbol: "NVDA",
      exchange: "XNAS",
      shares: 73,
      priority: 2
    },
    {
      type: "EQUITY",
      symbol: "AVGO",
      exchange: "XNAS",
      shares: 80,
      priority: 3
    },
    {
      type: "CRYPTO",
      symbol: "BTC",
      pair: "BTC/CAD",
      quantity: 0.274303,
      priority: 4
    },
    {
      type: "CRYPTO",
      symbol: "ETH",
      pair: "ETH/CAD",
      quantity: 0.25,
      priority: 5
    },
    {
      type: "EQUITY",
      symbol: "MSTR",
      exchange: "XNAS",
      shares: 40,
      priority: 6
    },
    {
      type: "EQUITY",
      symbol: "HOOD",
      exchange: "XNAS",
      shares: 35,
      priority: 7
    },
    {
      type: "EQUITY",
      symbol: "BMNR",
      exchange: "XNYS",
      shares: 140,
      priority: 8
    },
    {
      type: "EQUITY",
      symbol: "APLD",
      exchange: "XNAS",
      shares: 110,
      priority: 9
    }
  ]
};

// Guardrail: portfolio mutation is disabled at engine level.
// Any future UI edits must go through versioned portfolio adapters.
Object.freeze(PORTFOLIO);
Object.freeze(PORTFOLIO.assets);

