import { runSnapshotDeltaDetection } from "../detection/snapshotDeltaEngine.js";
import { classifyDetection } from "../detection/classifierEngine.js";
import { generateAlerts } from "./alertsFoundationEngine.js";
import { deliverAlerts } from "./alertDeliveryEngine.js";

const CHECK_INTERVAL_MS = 60 * 1000; // every 60 seconds

async function runAlertCycle() {
  try {
    const detection = runSnapshotDeltaDetection();
    const classification = classifyDetection(detection);
    const alerts = generateAlerts(classification);
    const result = deliverAlerts(alerts);

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
