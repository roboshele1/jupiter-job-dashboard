// renderer/hooks/usePortfolioSnapshot.js
// Read-only snapshot hook
// Adapter → UI boundary (NO engine, NO IPC, NO UI assumptions)

import { useMemo } from "react";
import {
  getPortfolioSummary,
  getPortfolioAllocation
} from "../services/portfolioSnapshot";

/**
 * Safe snapshot consumption hook
 * @param {Array} holdings - normalized holdings array
 */
export function usePortfolioSnapshot(holdings = []) {
  return useMemo(() => {
    return {
      summary: getPortfolioSummary(holdings),
      allocation: getPortfolioAllocation(holdings)
    };
  }, [holdings]);
}

