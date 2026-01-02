// engine/notifications/notificationsPolicy.js
// Notifications V1 — Policy engine (read-only)
// Consumes Alerts[] and emits NotificationCandidates[] deterministically

function isFiniteNumber(n) {
  return typeof n === 'number' && Number.isFinite(n);
}

// Default policy (conservative)
const DEFAULT_POLICY = {
  severities: ['high', 'medium'], // only escalate medium/high by default
  cooldownMs: {
    PORTFOLIO_IMPACT: 60 * 60 * 1000, // 1 hour
    RAPID_MOMENTUM: 30 * 60 * 1000,   // 30 minutes
    HIGH_CONFIDENCE_SIGNAL: 2 * 60 * 60 * 1000 // 2 hours
  }
};

/**
 * @param {Array} alerts - output of Alerts engine
 * @param {Object} lastEmittedAt - map: { [type]: timestampMs }
 * @param {Object} policy - override defaults if needed
 * @returns {Array} notification candidates
 */
export function evaluateNotifications(alerts = [], lastEmittedAt = {}, policy = DEFAULT_POLICY) {
  const now = Date.now();
  const out = [];

  if (!Array.isArray(alerts)) return out;

  for (const alert of alerts) {
    if (!alert || typeof alert !== 'object') continue;

    const { type, severity, value, message } = alert;

    // Severity gate
    if (!policy.severities.includes(severity)) continue;

    const lastTs = lastEmittedAt[type];
    const cooldown = policy.cooldownMs[type];

    // Cooldown gate
    if (isFiniteNumber(lastTs) && isFiniteNumber(cooldown)) {
      if (now - lastTs < cooldown) continue;
    }

    out.push({
      type,
      severity,
      value,
      message,
      emittedAt: now
    });
  }

  return out;
}

