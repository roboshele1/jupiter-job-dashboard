import fs from "fs";
import path from "path";

const ALERTS_DIR = path.resolve("engine/alerts");
const ALERT_HISTORY_FILE = path.join(ALERTS_DIR, "alert_history.json");

function ensureAlertHistory() {
  if (!fs.existsSync(ALERT_HISTORY_FILE)) {
    fs.writeFileSync(ALERT_HISTORY_FILE, JSON.stringify([], null, 2));
  }
}

export function deliverAlerts(alerts = []) {
  if (!Array.isArray(alerts) || alerts.length === 0) {
    return {
      status: "NO_ALERTS",
      delivered: 0
    };
  }

  ensureAlertHistory();

  const existing = JSON.parse(fs.readFileSync(ALERT_HISTORY_FILE, "utf8"));

  const enriched = alerts.map(alert => ({
    ...alert,
    deliveredAt: Date.now()
  }));

  const updatedHistory = [...existing, ...enriched];

  fs.writeFileSync(ALERT_HISTORY_FILE, JSON.stringify(updatedHistory, null, 2));

  // Terminal signal (first outward behavior)
  enriched.forEach(alert => {
    console.log(`[ALERT] ${alert.type} | ${alert.severity} | ${alert.message}`);
  });

  return {
    status: "DELIVERED",
    delivered: enriched.length
  };
}
