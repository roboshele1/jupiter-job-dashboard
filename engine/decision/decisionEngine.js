import { evaluatePortfolio, evaluateSymbols } from "./decisionRules.js";

export function runDecisionEngine({
  portfolioSnapshot,
  signalsSnapshot,
  riskSnapshot
}) {
  const decisions = [
    ...evaluatePortfolio(portfolioSnapshot, riskSnapshot),
    ...evaluateSymbols(portfolioSnapshot, signalsSnapshot)
  ];

  return {
    engine: "DECISION_ENGINE_V1",
    asOf: Date.now(),
    decisions
  };
}

