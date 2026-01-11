// renderer/insights/confidencePipeline.js
// Confidence pipeline with time + trend + session memory

import { readConfidenceHistory } from "./confidenceSessionStore.js";
import { runConfidenceTrendEngine } from "./confidenceTrendEngine.js";
import { runConfidenceTimeEngine } from "./confidenceTimeEngine.js";

export function buildConfidenceState() {
  const history = readConfidenceHistory();

  if (!history || history.length === 0) {
    return {
      current: null,
      trend: null,
      readiness: "UNKNOWN",
      time: { daysInState: 0 }
    };
  }

  const trendState = runConfidenceTrendEngine(history);
  const timeState = runConfidenceTimeEngine(history);

  return {
    ...trendState,
    time: timeState
  };
}
