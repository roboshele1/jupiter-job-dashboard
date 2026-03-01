/**
 * Continuous Daemon — Runs hourly, detects thesis breaches + alerts
 */

import { monitorThesis } from './thesisMonitor.js';
import { detectBreakoutCandidates, detectSectorRotations } from './predictiveSignals.js';

export async function runContinuousMonitoring(holdings, sendAlert) {
  console.log('[DAEMON] Starting continuous monitoring cycle...');

  try {
    // 1. Monitor thesis violations
    const thesisAlerts = await monitorThesis(holdings);
    for (const alert of thesisAlerts) {
      sendAlert({
        severity: alert.severity,
        title: alert.title,
        message: alert.message,
      });
      logAlert(alert);
    }

    // 2. Detect breakout candidates
    const breakouts = detectBreakoutCandidates(holdings);
    if (breakouts.length > 0) {
      sendAlert({
        severity: 'info',
        title: `${breakouts.length} breakout candidate(s) detected`,
        message: breakouts.map(b => `${b.symbol} (${(b.confidence * 100).toFixed(0)}% confidence)`).join(', '),
      });
    }

    // 3. Detect sector rotations
    const rotations = detectSectorRotations(groupBySector(holdings));
    if (rotations.length > 0) {
      sendAlert({
        severity: 'info',
        title: `Sector rotation detected: ${rotations[0].sector}`,
        message: rotations[0].message,
      });
    }

    console.log('[DAEMON] Monitoring cycle complete. Found:', {
      thesisAlerts: thesisAlerts.length,
      breakouts: breakouts.length,
      rotations: rotations.length,
    });

  } catch (err) {
    sendAlert({
      severity: 'warning',
      title: 'Daemon monitoring error',
      message: err.message,
    });
  }
}

function groupBySector(holdings) {
  const map = {};
  holdings.forEach(h => {
    const sector = h.sector || 'Other';
    if (!map[sector]) map[sector] = [];
    map[sector].push(h);
  });
  return map;
}

function logAlert(alert) {
  const log = {
    timestamp: new Date().toISOString(),
    ...alert,
  };
  console.log('[ALERT LOG]', JSON.stringify(log));
  // In production, persist to database
}
