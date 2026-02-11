// engine/alerts/priorityThresholdEngine.js
// PRIORITY THRESHOLD ENGINE — Institutional Guardrail Layer
// ----------------------------------------------------------
// Purpose:
// - Filters and escalates alerts based on severity + priority
// - Prevents notification fatigue
// - Ensures only meaningful events break through to user channels
//
// Position in pipeline:
// detection → classification → intelligence → escalation → priority filter → delivery

/**
 * Map severity to hard priority thresholds.
 */
const PRIORITY_THRESHOLDS = {
  CRITICAL: 1,
  ACTION: 2,
  WARNING: 3,
  INFO: 5
};

/**
 * Decide if an alert should break through to user channels.
 * @param {Object} escalationOutput
 * @returns {Object} filtered decision
 */
export function applyPriorityThreshold(escalationOutput) {
  if (!escalationOutput) {
    return {
      status: "NO_DATA",
      allowDelivery: false
    };
  }

  const { severity, routing, message, timestamp } = escalationOutput;

  const requiredPriority =
    PRIORITY_THRESHOLDS[severity] ?? PRIORITY_THRESHOLDS.INFO;

  const actualPriority = routing?.priority ?? 5;

  const allowDelivery = actualPriority <= requiredPriority;

  return {
    timestamp: timestamp || Date.now(),
    severity,
    message,
    routing,
    requiredPriority,
    actualPriority,
    allowDelivery,
    status: allowDelivery ? "DELIVER" : "SUPPRESSED"
  };
}
