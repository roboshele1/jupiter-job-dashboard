// electron/ipc/signalsIpc.js
// Signals IPC — read-only, engine-sourced (ADD-ONLY)

import { buildAlertsFromInsights } from "../../engine/alerts/alertsAdapter.js";
import { buildSignalsSnapshot } from "../../engine/signals/signalsEngine.js";

/**
 * Registers read-only IPC for Signals snapshots.
 * - No renderer assumptions
 * - No mutation
 * - Deterministic output
 */
export function registerSignalsIpc(ipcMain, getInsightsSnapshot) {
  ipcMain.handle("signals:getSnapshot", async () => {
    // Pull upstream insights snapshot (authoritative)
    const insights = await getInsightsSnapshot();

    // Derive alerts from insights
    const alerts = buildAlertsFromInsights(insights);

    // Build signals snapshot from engine
    const snapshot = buildSignalsSnapshot({
      insights,
      alerts
    });

    return snapshot;
  });
}

