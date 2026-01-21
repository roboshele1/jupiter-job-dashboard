/**
 * Live Runtime — Electron-Owned (V1)
 * ----------------------------------
 * Purpose:
 * - Single authority for long-lived scanners
 * - UI-independent
 * - Electron main-process safe
 *
 * HARD RULES:
 * - Does NOT start scanners yet
 * - Does NOT alter cadence
 * - Does NOT touch UI
 * - Append-only foundation
 */

let started = false;

function startLiveRuntime() {
  if (started) return;
  started = true;

  console.log("[LIVE_RUNTIME] Initialized (no scanners attached yet)");
}

function isLiveRuntimeActive() {
  return started;
}

module.exports = {
  startLiveRuntime,
  isLiveRuntimeActive
};
