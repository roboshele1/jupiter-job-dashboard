/**
 * interpretationEngine
 * --------------------
 * Pure interpretation orchestrator.
 */

import { createEmptyInterpretation } from "./interpretationSchema";
import {
  interpretSnapshot,
  interpretPortfolio,
  interpretAllocation,
  interpretHoldings
} from "./interpretationRules";

export function interpretDashboardTruth(snapshot) {
  const interpretation = createEmptyInterpretation();

  interpretSnapshot(snapshot, interpretation);
  interpretPortfolio(snapshot, interpretation);
  interpretAllocation(snapshot, interpretation);
  interpretHoldings(snapshot, interpretation);

  return interpretation;
}

