// engine/alerts/alertIntelligenceEngine.js
// ALERT INTELLIGENCE LAYER V1
// Interprets raw alerts into severity, human language, and escalation priority.
// Append-only layer. Does NOT modify detection, classifier, or delivery engines.

function severityFromState(classification) {
  const states = classification?.portfolioStates || {};

  if (states.drawdown === "CRITICAL") return "CRITICAL";
  if (states.drawdown === "ELEVATED") return "WARNING";

  if (states.concentration === "ELEVATED") return "WARNING";
  if (states.concentration === "BUILDING") return "WATCH";

  return "INFO";
}

function buildHumanMessage(classification) {
  const states = classification?.portfolioStates || {};
  const drift = classification?.driftSignals || [];

  let messages = [];

  if (states.drawdown === "CRITICAL") {
    messages.push("Portfolio drawdown threshold breached.");
  }

  if (states.drawdown === "ELEVATED") {
    messages.push("Drawdown increasing — monitor risk exposure.");
  }

  if (states.concentration === "ELEVATED") {
    messages.push("Position concentration rising.");
  }

  if (states.concentration === "BUILDING") {
    messages.push("Concentration trend forming.");
  }

  if (drift.length > 0) {
    messages.push("Allocation drift detected across holdings.");
  }

  if (messages.length === 0) {
    messages.push("Portfolio stable. No abnormal conditions.");
  }

  return messages.join(" ");
}

function escalationLevel(severity) {
  switch (severity) {
    case "CRITICAL":
      return "INTERRUPT";
    case "WARNING":
      return "ACTIVE_NOTIFY";
    case "WATCH":
      return "PASSIVE_NOTIFY";
    default:
      return "LOG_ONLY";
  }
}

export function interpretAlerts(classification) {
  const severity = severityFromState(classification);
  const message = buildHumanMessage(classification);
  const escalation = escalationLevel(severity);

  return {
    timestamp: Date.now(),
    severity,
    escalation,
    message,
    classification
  };
}
