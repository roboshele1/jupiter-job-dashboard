/**
 * Confidence Trend Engine (V1.1)
 * ------------------------------
 * Input: [{ timestamp: number, confidenceBand: "HIGH"|"MODERATE"|"LOW"|string }]
 * Output is ALWAYS shape-stable (never returns null current).
 */

const DAY_MS = 86400000;

function bandScore(band) {
  if (band === "HIGH") return 3;
  if (band === "MODERATE") return 2;
  if (band === "LOW") return 1;
  return 0; // UNKNOWN/invalid
}

function normalizeBand(band) {
  if (band === "HIGH" || band === "MODERATE" || band === "LOW") return band;
  return "UNKNOWN";
}

function safeNumber(n) {
  return typeof n === "number" && Number.isFinite(n) ? n : null;
}

function daysInState(sorted, currentBand, now) {
  if (!sorted.length) return 0;

  // Walk backwards until band changes
  let idx = sorted.length - 1;
  while (idx >= 0 && sorted[idx].confidenceBand === currentBand) idx--;

  const firstIdxInRun = idx + 1;
  const firstTs = sorted[firstIdxInRun]?.timestamp;
  const startTs = safeNumber(firstTs) ?? now;

  const diffMs = Math.max(0, now - startTs);
  return Math.max(0, Math.round(diffMs / DAY_MS));
}

function computeTrend(sorted) {
  if (sorted.length < 2) {
    return { direction: "UNKNOWN", velocity: "UNKNOWN" };
  }

  const first = bandScore(sorted[0].confidenceBand);
  const last = bandScore(sorted[sorted.length - 1].confidenceBand);

  if (first === 0 || last === 0) {
    return { direction: "UNKNOWN", velocity: "UNKNOWN" };
  }

  const delta = last - first;
  let direction = "STABLE";
  if (delta > 0) direction = "IMPROVING";
  if (delta < 0) direction = "DETERIORATING";

  // Velocity heuristic: magnitude of delta + time window
  const windowMs = Math.max(
    1,
    sorted[sorted.length - 1].timestamp - sorted[0].timestamp
  );
  const windowDays = Math.max(1, Math.round(windowMs / DAY_MS));
  const mag = Math.abs(delta);

  let velocity = "LOW";
  if (mag >= 2) velocity = "HIGH";
  else if (mag === 1) velocity = windowDays <= 14 ? "MODERATE" : "LOW";

  return { direction, velocity };
}

function computeAlerts(currentBand, days) {
  const alerts = [];

  if (currentBand === "LOW") {
    let severity = "HIGH";
    if (days >= 14) severity = "CRITICAL";
    else if (days >= 7) severity = "HIGH";
    else severity = "MODERATE";

    alerts.push({
      type: "PERSISTENT_LOW_CONFIDENCE",
      severity,
      durationDays: days,
      message: `${days} days in LOW confidence.`
    });
  }

  return alerts;
}

function computeReadiness(currentBand, trend, alerts) {
  if (currentBand === "LOW") return "NOT_READY";
  if (currentBand === "UNKNOWN") return "UNKNOWN";

  // MODERATE/HIGH
  const hasCritical = alerts.some((a) => a.severity === "CRITICAL");
  if (hasCritical) return "NOT_READY";

  if (currentBand === "HIGH") {
    if (trend.direction === "DETERIORATING") return "CAUTION";
    return "READY";
  }

  // MODERATE
  if (trend.direction === "IMPROVING") return "CAUTION";
  if (trend.direction === "STABLE") return "CAUTION";
  if (trend.direction === "DETERIORATING") return "NOT_READY";
  return "UNKNOWN";
}

export function runConfidenceTrendEngine(history = []) {
  const now = Date.now();

  const cleaned = Array.isArray(history)
    ? history
        .map((h) => ({
          timestamp: safeNumber(h?.timestamp),
          confidenceBand: normalizeBand(h?.confidenceBand)
        }))
        .filter((h) => h.timestamp !== null)
        .sort((a, b) => a.timestamp - b.timestamp)
    : [];

  const currentBand =
    cleaned.length > 0
      ? cleaned[cleaned.length - 1].confidenceBand
      : "UNKNOWN";

  const days = daysInState(cleaned, currentBand, now);
  const trend = computeTrend(cleaned);
  const alerts = computeAlerts(currentBand, days);
  const readiness = computeReadiness(currentBand, trend, alerts);

  return {
    meta: {
      engine: "CONFIDENCE_TRENDS_V1.1",
      generatedAt: now
    },
    current: {
      confidenceBand: currentBand,
      days
    },
    trend,
    readiness,
    alerts
  };
}
