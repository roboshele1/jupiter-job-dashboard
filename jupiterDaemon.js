/**
 * JUPITER MASTER DAEMON
 *
 * Single entry point for all intelligence loops.
 *
 * Starts:
 *  - 60s alert runner
 *  - 30min opportunity digest scheduler
 *
 * Runs continuously as Jupiter's brain.
 */

console.log("\n==============================");
console.log("JUPITER MASTER DAEMON STARTING");
console.log("==============================\n");

async function startDaemon() {

  try {

    // 60s intelligence loop
    const alertRunnerModule =
      await import("./engine/alerts/alertBackgroundRunner.js");

    const alertRunner =
      alertRunnerModule.default || alertRunnerModule;

    alertRunner.startAlertBackgroundRunner();

    console.log("[DAEMON] 60s alert runner active.");

  } catch (err) {
    console.log("[DAEMON ERROR] alert runner:", err.message);
  }

  try {

    // 30min opportunity loop
    const schedulerModule =
      await import("./engine/scheduler/opportunityDigestScheduler.js");

    const scheduler =
      schedulerModule.default || schedulerModule;

    scheduler.startOpportunityDigestScheduler();

    console.log("[DAEMON] 30min opportunity scheduler active.");

  } catch (err) {
    console.log("[DAEMON ERROR] scheduler:", err.message);
  }

  console.log("\nJUPITER DAEMON LIVE — intelligence running continuously.\n");
}

startDaemon();
