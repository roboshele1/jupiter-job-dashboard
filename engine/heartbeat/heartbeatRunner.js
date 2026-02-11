import { startHeartbeatScheduler } from "./schedule.js";

async function bootHeartbeat() {
  try {
    console.log("[HEARTBEAT] Booting service...");
    startHeartbeatScheduler();
  } catch (err) {
    console.error("[HEARTBEAT] Failed to start:", err.message);
  }
}

bootHeartbeat();
