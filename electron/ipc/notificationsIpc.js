import { buildAlertsFromInsights } from "../../engine/alerts/alertsAdapter.js";
import { evaluateNotifications } from "../../engine/notifications/notificationsPolicy.js";
import { dedupAndAggregate } from "../../engine/notifications/notificationsDedup.js";

/**
 * Notifications IPC — Read Only
 * --------------------------------
 * Downstream of Signals → Alerts → Notifications
 * No persistence. No mutation.
 */

let lastEmittedMap = {};

export function registerNotificationsIpc(ipcMain, getInsightsSnapshot) {
  ipcMain.handle("notifications:getLatest", async () => {
    const insights = await getInsightsSnapshot();

    if (!insights) {
      return [];
    }

    const alerts = buildAlertsFromInsights(insights);
    const notifications = evaluateNotifications(alerts, lastEmittedMap);
    const deduped = dedupAndAggregate(notifications);

    // Update last-emitted timestamps
    deduped.forEach(n => {
      lastEmittedMap[n.type] = n.emittedAt;
    });

    return deduped;
  });
}

