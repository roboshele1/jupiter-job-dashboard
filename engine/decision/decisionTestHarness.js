import { runDecisionEngine } from "./decisionEngine.js";

const mock = runDecisionEngine({
  portfolioSnapshot: {
    totals: { snapshotValue: 100000 },
    positions: [{ symbol: "NVDA" }]
  },
  signalsSnapshot: {
    signals: [{ symbol: "NVDA", confidence: "High", portfolioImpact: "Positive" }]
  },
  riskSnapshot: {
    metrics: { maxDrawdownPct: 10 }
  }
});

console.log(JSON.stringify(mock, null, 2));

