// renderer/services/snapshotAdapterDebug.js
// Read-only debug shim to satisfy named exports expected by debugBoot

import {
  getPortfolioSummary,
  getPortfolioAllocation,
} from "./portfolioSnapshot";

import { holdings } from "../state/holdings";

export function snapshotAdapter() {
  return {
    summary: getPortfolioSummary(holdings),
    allocation: getPortfolioAllocation(holdings),
  };
}

// Explicit named exports (DO NOT REMOVE)
export { getPortfolioAllocation, getPortfolioSummary };

