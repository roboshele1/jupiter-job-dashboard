/**
 * Demo Mode Detector
 * ------------------
 * Single source of truth for demo vs live execution.
 *
 * HARD RULES:
 * - No side effects
 * - No IPC registration
 * - No engine access
 * - Environment-driven only
 */

function isDemoMode() {
  return process.env.DEMO_MODE === "true";
}

module.exports = {
  isDemoMode,
};
