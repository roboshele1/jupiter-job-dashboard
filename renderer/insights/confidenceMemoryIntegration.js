// renderer/insights/confidenceMemoryIntegration.js
// CONFIDENCE_MEMORY_INTEGRATION_V1
// Bridges confidence history → trend engine → god-mode consumption

import { readConfidenceHistory } from "./confidenceHistoryStore.js";
import { runConfidenceTrendEngine } from "./confidenceTrendEngine.js";

export function buildConfidenceState() {
  const history = readConfidenceHistory();

  // No history yet → explicit UNKNOWN state (deterministic)
  if (!Array.isArray(history) || history.length === 0) {
    return {
      meta: {
        engine: "CONFIDENCE_MEMORY_INTEGRATION_V1",
        generatedAt: Date.now()
      },
      current: {
        confidenceBand: "UNKNOWN",
        days: 0
      },
      trend: {
        direction: "UNKNOWN",
        velocity: "UNKNOWN"
      },
      readiness: "UNKNOWN",
      alerts: []
    };
  }

  return runConfidenceTrendEngine(history);
}
