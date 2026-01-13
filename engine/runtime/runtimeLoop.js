// engine/runtime/runtimeLoop.js
// Jupiter continuous runtime daemon

import { TASKS } from "./taskRegistry.js";
import { writeSnapshot } from "./runtimeStore.js";

export function startRuntimeLoop() {
  console.log("[RUNTIME] Jupiter runtime loop starting…");

  TASKS.forEach(task => {
    async function tick() {
      try {
        const result = await task.run();
        writeSnapshot(task.key, result);
        console.log(`[RUNTIME] ${task.key} updated`);
      } catch (err) {
        console.error(`[RUNTIME] ${task.key} failed`, err.message);
      }
    }

    tick();
    setInterval(tick, task.intervalMs);
  });
}
