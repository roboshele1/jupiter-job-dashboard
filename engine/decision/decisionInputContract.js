// engine/decision/decisionInputContract.js
// DECISION ENGINE V2 — INPUT CONTRACT (READ-ONLY)

export const DecisionInputContractV2 = {
  engine: "DECISION_ENGINE_V2",
  asOf: null, // epoch ms
  portfolio: {
    totalValue: null,
    currency: null,
    positions: [] // [{ symbol, qty, weight }]
  },
  signals: {
    summary: [], // [{ symbol, signal, confidence }]
    raw: []      // engine-agnostic payload
  },
  risk: {
    posture: null, // LOW | MODERATE | HIGH | EXTREME
    concentration: [],
    exposures: {}
  }
};

