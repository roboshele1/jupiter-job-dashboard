// engine/notifications/notificationsDedup.js
// Notifications V1 — Deduplication & Aggregation (policy-only)
// Consumes NotificationCandidates[] and returns a reduced set deterministically

function isFiniteNumber(n) {
  return typeof n === 'number' && Number.isFinite(n);
}

/**
 * @param {Array} notifications - output of notificationsPolicy.evaluateNotifications
 * @param {Object} options
 * @param {number} options.windowMs - aggregation window
 * @returns {Array} deduplicated / aggregated notifications
 */
export function dedupAndAggregate(notifications = [], options = {}) {
  const windowMs = isFiniteNumber(options.windowMs) ? options.windowMs : 30 * 60 * 1000; // 30 min default
  const now = Date.now();

  if (!Array.isArray(notifications)) return [];

  const byType = new Map();

  for (const n of notifications) {
    if (!n || typeof n !== 'object') continue;

    const { type, emittedAt } = n;
    if (!type || !isFiniteNumber(emittedAt)) continue;

    if (!byType.has(type)) {
      byType.set(type, []);
    }
    byType.get(type).push(n);
  }

  const out = [];

  for (const [type, items] of byType.entries()) {
    // Keep only items inside the aggregation window
    const recent = items.filter(i => now - i.emittedAt <= windowMs);

    if (recent.length === 0) continue;

    if (recent.length === 1) {
      out.push(recent[0]);
      continue;
    }

    // Aggregate
    const last = recent[recent.length - 1];
    out.push({
      type,
      severity: last.severity,
      value: last.value,
      message: `${recent.length} ${type} alerts within ${Math.round(windowMs / 60000)} minutes`,
      emittedAt: last.emittedAt,
      aggregatedCount: recent.length
    });
  }

  return out;
}

