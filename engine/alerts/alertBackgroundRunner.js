import { runSnapshotDeltaDetection } from "../detection/snapshotDeltaEngine.js";
import { classifyDetection } from "../detection/classifierEngine.js";
import { generateAlerts } from "./alertsFoundationEngine.js";
import { deliverAlerts } from "./alertDeliveryEngine.js";

/* APPEND-ONLY: Desktop Notification Bridge */
import { pushDesktopNotifications } from "./desktopNotifier.js";

/* APPEND-ONLY: Alert Intelligence Layer */
import { interpretAlerts } from "./alertIntelligenceEngine.js";

const CHECK_INTERVAL_MS = 60 * 1000; // every 60 seconds

async function runAlertCycle() {
  try {
    const detection = runSnapshotDeltaDetection();
    const classification = classifyDetection(detection);

    /* APPEND-ONLY: Intelligence interpretation */
    const intelligence = interpretAlerts(classification);

    const alerts = generateAlerts(classification);
    const result = deliverAlerts(alerts);

    /* APPEND-ONLY: Trigger OS notifications */
    pushDesktopNotifications(alerts);

    /* APPEND-ONLY: Log human intelligence output */
    if (intelligence?.severity !== "INFO") {
      console.log(
        `[JUPITER INTELLIGENCE] ${intelligence.severity} — ${intelligence.message}`
      );
    }

    if (result.delivered > 0) {
      console.log(`[ALERT RUNNER] ${result.delivered} alert(s) delivered.`);
    }
  } catch (err) {
    console.error("[ALERT RUNNER ERROR]", err.message);
  }
}

export function startAlertBackgroundRunner() {
  console.log("[ALERT RUNNER] Started — monitoring portfolio continuously.");

  runAlertCycle(); // immediate first run

  setInterval(() => {
    runAlertCycle();
  }, CHECK_INTERVAL_MS);
}
