/**
 * Risk Snapshot IPC Adapter (READ-ONLY)
 * ------------------------------------
 * Risk is DERIVED from Portfolio
 * Portfolio remains authoritative
 */

import { computeRiskSnapshot } from "../risk/riskEngine.js";

export function buildRiskFromPortfolio(portfolioSnapshot) {
  return computeRiskSnapshot(portfolioSnapshot);
}

