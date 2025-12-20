/**
 * Intelligence Engine
 * -------------------
 * Central coordinator (read-only).
 */

import { loadSnapshot } from "./snapshotReader.js";
import { requiredContribution } from "./growthQueryEngine.js";

export function runIntelligence(snapshot = "T0", series = []) {
  const snap = loadSnapshot(snapshot);

  return {
    snapshotLoaded: !!snap,
    contributionExample: requiredContribution({
      target: 100000,
      months: 24,
      annualReturn: 0.12,
    }),
  };
}

