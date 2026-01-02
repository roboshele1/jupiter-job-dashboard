// engine/alerts/alertsAdapter.js
// Alerts V1 — Downstream adapter (read-only)
// Consumes an Insights snapshot and returns evaluated alerts

import { evaluateAlerts } from './alertsEngine.js';

export function buildAlertsFromInsights(insightsSnapshot, thresholds) {
  if (!insightsSnapshot || typeof insightsSnapshot !== 'object') {
    return [];
  }
  return evaluateAlerts(insightsSnapshot, thresholds);
}

