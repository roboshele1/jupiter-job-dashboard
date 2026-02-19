/**
 * Live Runtime — Electron-Owned (V3)
 */

import { createRequire } from "module";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);
const require    = createRequire(import.meta.url);

let started = false;

export function startLiveRuntime() {
  if (started) return;
  started = true;

  console.log("[LIVE_RUNTIME] Initializing...");

  try {
    const schedulerPath = resolve(__dirname, "../asymmetry/universeScheduler.js");
    const { startScheduler } = require(schedulerPath);
    startScheduler();
    console.log("[LIVE_RUNTIME] ✓ Autonomous moonshot scanner started");
    console.log("[LIVE_RUNTIME] ✓ PRIMARY scan every 60s | DEEP_ASYMMETRY every 300s");
  } catch (err) {
    console.error("[LIVE_RUNTIME] ✗ Scanner failed to start:", err.message);
  }
}

export function isLiveRuntimeActive() {
  return started;
}

export default { startLiveRuntime, isLiveRuntimeActive };
