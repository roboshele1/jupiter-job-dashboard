// electron/ipc/alertsIpc.js
// Alerts V1 — IPC exposure (read-only)

import { ipcMain } from 'electron';
import { buildAlertsFromInsights } from '../../engine/alerts/alertsAdapter.js';

// Expects the renderer to pass a fully-built Insights snapshot.
// No fetching, no mutation, no side effects.
export function registerAlertsIpc() {
  ipcMain.handle('alerts:evaluate', async (_evt, insightsSnapshot) => {
    try {
      return buildAlertsFromInsights(insightsSnapshot);
    } catch (e) {
      return {
        error: true,
        message: 'alerts_evaluation_failed'
      };
    }
  });
}

