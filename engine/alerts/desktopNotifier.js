// engine/alerts/desktopNotifier.js
// Desktop Notification Bridge (V1)
// Emits native macOS notifications when alerts are produced.
// Pure delivery layer — no logic, no math, no classification.

import { exec } from "child_process";

function sendMacNotification(title, message) {
  const script = `osascript -e 'display notification "${message}" with title "${title}"'`;
  exec(script);
}

export function pushDesktopNotifications(alerts = []) {
  if (!Array.isArray(alerts) || alerts.length === 0) {
    return { status: "NO_NOTIFICATIONS_SENT" };
  }

  alerts.forEach(alert => {
    const title = "JUPITER Alert";
    const message = alert.message || JSON.stringify(alert);
    sendMacNotification(title, message);
  });

  return {
    status: "NOTIFICATIONS_SENT",
    count: alerts.length
  };
}
