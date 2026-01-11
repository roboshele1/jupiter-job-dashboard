/**
 * Confidence Trend Engine — V1
 * --------------------------------
 * Institutional-grade confidence trend analysis.
 * Deterministic. Read-only. Engine-only.
 *
 * Inputs:
 *  - history: Array of confidence snapshots ordered oldest → newest
 *
 * Snapshot shape:
 *  {
 *    timestamp: number,
 *    confidenceBand: "HIGH" | "MODERATE" | "LOW"
 *  }
 */

const CONFIDENCE_SCORE = {
  HIGH: 3,
  MODERATE: 2,
  LOW: 1
};

function normalizeHistory(history = []) {
  return history
    .filter(h => h && CONFIDENCE_SCORE[h.confidenceBand])
    .sort((a, b) => a.timestamp - b.timestamp);
}

function computeDirection(scores) {
  if (scores.length < 2) return "STABLE";
  const delta = scores[scores.length - 1] - scores[0];
  if (delta > 0) return "IMPROVING";
  if (delta < 0) return "DETERIORATING";
  return "STABLE";
}

function computeVelocity(scores, timestamps) {
  if (scores.length < 3) return "SLOW";

  const timeSpanDays =
    (timestamps[timestamps.length - 1] - timestamps[0]) /
    (1000 * 60 * 60 * 24);

  if (timeSpanDays === 0) return "SLOW";

  const magnitude = Math.abs(scores[scores.length - 1] - scores[0]);

  if (magnitude >= 2 && timeSpanDays <= 7) return "FAST";
  if (magnitude >= 1 && timeSpanDays <= 14) return "MODERATE";
  return "SLOW";
}

function computeTimeInState(history) {
  if (history.length === 0) return null;

  const current = history[history.length - 1].confidenceBand;
  let days = 0;

  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i].confidenceBand !== current) break;
    if (i > 0) {
      const delta =
        (history[i].timestamp - history[i - 1].timestamp) /
        (1000 * 60 * 60 * 24);
      days += delta;
    }
  }

  return {
    confidenceBand: current,
    days: Math.round(days)
  };
}

function computeReadiness(direction, currentBand) {
  if (currentBand === "LOW" && direction === "DETERIORATING") {
    return "NOT_READY";
  }
  if (currentBand === "LOW" && direction === "STABLE") {
    return "WAIT";
  }
  if (currentBand === "MODERATE" && direction === "IMPROVING") {
    return "EARLY_SIGNAL";
  }
  if (currentBand === "HIGH" && direction === "IMPROVING") {
    return "FAVORABLE";
  }
  return "NEUTRAL";
}

export function runConfidenceTrendEngine(history = []) {
  const normalized = normalizeHistory(history);

  if (normalized.length === 0) {
    return {
      meta: {
        engine: "CONFIDENCE_TRENDS_V1",
        generatedAt: Date.now()
      },
      status: "INSUFFICIENT_DATA"
    };
  }

  const scores = normalized.map(h => CONFIDENCE_SCORE[h.confidenceBand]);
  const timestamps = normalized.map(h => h.timestamp);

  const direction = computeDirection(scores);
  const velocity = computeVelocity(scores, timestamps);
  const timeInState = computeTimeInState(normalized);
  const readiness = computeReadiness(direction, timeInState?.confidenceBand);

  const alerts = [];
  if (timeInState && timeInState.days >= 7 && timeInState.confidenceBand === "LOW") {
    alerts.push({
      type: "PERSISTENT_LOW_CONFIDENCE",
      severity: "HIGH",
      message: `${timeInState.days} days in LOW confidence.`
    });
  }

  return {
    meta: {
      engine: "CONFIDENCE_TRENDS_V1",
      generatedAt: Date.now()
    },
    current: timeInState,
    trend: {
      direction,
      velocity
    },
    readiness,
    alerts
  };
}
