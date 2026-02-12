// engine/alerts/desktopNotifier.js
// Jupiter — macOS Desktop Notification Bridge (DET)

import notifier from 'node-notifier';

/**
 * Push a macOS notification
 * @param {Object} alert Alert object
 */
export function pushDesktopNotification(alert) {
  if (!alert) return;

  const title = `[${alert.severity || 'INFO'}] ${alert.symbol || 'N/A'}`;
  const message = alert.message || 'No message';

  notifier.notify({
    title,
    message,
    wait: false
  });

  console.log(`[DESKTOP NOTIFICATION] ${title} — ${message}`);
}
