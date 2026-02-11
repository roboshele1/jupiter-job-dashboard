// engine/alerts/escalationRouter.js
// ESCALATION ROUTING LAYER V1
// Determines how aggressively Jupiter surfaces alerts.
// Does NOT change detection, intelligence, or delivery.
// Pure routing + priority logic.

function routeBySeverity(intelligence) {
  const severity = intelligence?.severity || "INFO";

  switch (severity) {
    case "CRITICAL":
      return {
        channel: "DESKTOP_PERSISTENT",
        repeat: true,
        priority: 1
      };

    case "WARNING":
      return {
        channel: "DESKTOP_STANDARD",
        repeat: false,
        priority: 2
      };

    case "WATCH":
      return {
        channel: "DESKTOP_PASSIVE",
        repeat: false,
        priority: 3
      };

    default:
      return {
        channel: "LOG_ONLY",
        repeat: false,
        priority: 4
      };
  }
}

export function routeEscalation(intelligence) {
  return {
    timestamp: Date.now(),
    severity: intelligence.severity,
    routing: routeBySeverity(intelligence),
    message: intelligence.message
  };
}
