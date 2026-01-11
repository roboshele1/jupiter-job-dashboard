// Confidence Trend Engine — V1.1
// Institutional-grade confidence deterioration & persistence analysis
// Deterministic, read-only, append-only

const CONFIDENCE_ORDER = ["LOW", "MODERATE", "HIGH"];

function confidenceRank(level) {
  return CONFIDENCE_ORDER.indexOf(level ?? "LOW");
}

function daysBetween(tsA, tsB) {
  return Math.floor(Math.abs(tsA - tsB) / 86400000);
}

export function runConfidenceTrendEngine(history = []) {
  const now = Date.now();

  if (!Array.isArray(history) || history.length === 0) {
    return {
      meta: {
        engine: "CONFIDENCE_TRENDS_V1.1",
        generatedAt: now
      },
      current: null,
      trend: null,
      readiness: "UNKNOWN",
      alerts: []
    };
  }

  const sorted = history
    .slice()
    .sort((a, b) => a.timestamp - b.timestamp);

  const latest = sorted[sorted.length - 1];
  const previous = sorted[sorted.length - 2] || null;

  // ─────────────────────────────────────────
  // CURRENT STATE
  // ─────────────────────────────────────────
  let timeInCurrentState = 0;
  for (let i = sorted.length - 1; i >= 0; i--) {
    if (sorted[i].confidenceBand !== latest.confidenceBand) break;
    timeInCurrentState = daysBetween(sorted[i].timestamp, now);
  }

  const current = {
    confidenceBand: latest.confidenceBand,
    days: timeInCurrentState
  };

  // ─────────────────────────────────────────
  // TREND DIRECTION & VELOCITY
  // ─────────────────────────────────────────
  let direction = "STABLE";
  let velocity = "LOW";

  if (previous) {
    const delta =
      confidenceRank(latest.confidenceBand) -
      confidenceRank(previous.confidenceBand);

    if (delta < 0) direction = "DETERIORATING";
    if (delta > 0) direction = "IMPROVING";

    const daysDelta = Math.max(
      1,
      daysBetween(previous.timestamp, latest.timestamp)
    );

    if (Math.abs(delta) / daysDelta > 0.15) velocity = "HIGH";
    else if (Math.abs(delta) / daysDelta > 0.05) velocity = "MODERATE";
  }

  const trend = { direction, velocity };

  // ─────────────────────────────────────────
  // DETERIORATION ALERTS (NEW)
  // ─────────────────────────────────────────
  const alerts = [];

  // 1. Prolonged LOW confidence
  if (current.confidenceBand === "LOW" && current.days >= 7) {
    alerts.push({
      type: "PERSISTENT_LOW_CONFIDENCE",
      severity: current.days >= 14 ? "CRITICAL" : "HIGH",
      durationDays: current.days,
      message: `${current.days} days in LOW confidence.`
    });
  }

  // 2. Prolonged deterioration trend
  if (trend.direction === "DETERIORATING" && current.days >= 10) {
    alerts.push({
      type: "PROLONGED_DETERIORATION",
      severity: current.days >= 21 ? "CRITICAL" : "HIGH",
      durationDays: current.days,
      message: `Confidence deteriorating for ${current.days} consecutive days.`
    });
  }

  // 3. Confidence stagnation
  if (
    current.confidenceBand !== "HIGH" &&
    current.days >= 21 &&
    trend.direction === "STABLE"
  ) {
    alerts.push({
      type: "CONFIDENCE_STAGNATION",
      severity: "MEDIUM",
      durationDays: current.days,
      message: `Confidence stalled in ${current.confidenceBand} for ${current.days} days.`
    });
  }

  // 4. Whipsaw instability (too many flips)
  let flips = 0;
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].confidenceBand !== sorted[i - 1].confidenceBand) {
      flips++;
    }
  }

  if (flips >= 4 && daysBetween(sorted[0].timestamp, now) <= 30) {
    alerts.push({
      type: "CONFIDENCE_WHIPSAW",
      severity: "MEDIUM",
      durationDays: daysBetween(sorted[0].timestamp, now),
      message: "Confidence is unstable and flipping frequently."
    });
  }

  // ─────────────────────────────────────────
  // READINESS SIGNAL (NOT ADVICE)
  // ─────────────────────────────────────────
  let readiness = "NOT_READY";

  if (
    current.confidenceBand === "HIGH" &&
    trend.direction !== "DETERIORATING" &&
    alerts.length === 0
  ) {
    readiness = "READY";
  } else if (
    current.confidenceBand === "MODERATE" &&
    trend.direction === "IMPROVING"
  ) {
    readiness = "WATCH";
  }

  return {
    meta: {
      engine: "CONFIDENCE_TRENDS_V1.1",
      generatedAt: now
    },
    current,
    trend,
    readiness,
    alerts
  };
}
