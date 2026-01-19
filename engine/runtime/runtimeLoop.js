// engine/runtime/runtimeLoop.js
// Jupiter continuous runtime daemon (Autonomy-safe, explicit tasks)
// ---------------------------------------------------------------
// Runs selected autonomous tasks on fixed intervals.
// No UI coupling. No IPC. No renderer dependencies.

import { writeSnapshot } from "./runtimeStore.js";

/**
 * Start the runtime loop with an explicit task list.
 * This guarantees deterministic and intentional autonomy.
 */
export function startRuntimeLoop(tasks = []) {
  console.log("[RUNTIME] Jupiter runtime loop starting…");

  tasks.forEach((task) => {
    async function tick() {
      try {
        const result = await task.run();
        writeSnapshot(task.key, result);
        console.log(`[RUNTIME] ${task.key} updated`);
      } catch (err) {
        console.error(`[RUNTIME] ${task.key} failed`, err.message);
      }
    }

    // Run immediately, then on interval
    tick();
    setInterval(tick, task.intervalMs);
  });
}

