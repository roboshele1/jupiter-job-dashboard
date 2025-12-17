/**
 * JUPITER — Execution Preview Engine (SIMULATED)
 * Phase 8 Step 2
 *
 * Combines automation intents with execution permissions
 * to produce a truthful execution preview.
 *
 * NO EXECUTION. NO SIDE EFFECTS.
 */

import { getExecutionPermissions, consumeCycle } from "./executionPermissions";

function permissionForIntent(intentType, permissions) {
  switch (intentType) {
    case "WOULD_REBALANCE":
      return permissions.allowRebalance;
    case "WOULD_PAUSE_DCA":
    case "WOULD_RESUME_DCA":
      return permissions.allowDCA;
    case "WOULD_REDUCE":
      return permissions.allowReduce;
    default:
      return false;
  }
}

export function runExecutionPreview(intents) {
  const permissions = getExecutionPermissions();
  const previews = [];

  if (!intents || intents.length === 0) return previews;

  for (const intent of intents) {
    const allowed = permissionForIntent(intent.type, permissions);

    previews.push({
      intent: intent.type,
      severity: intent.severity,
      category: intent.category,
      permission: allowed ? "ALLOWED" : "BLOCKED",
      mode: permissions.mode,
      executed: false,
      reason: allowed
        ? "Permission granted (simulation only)"
        : "Blocked by execution permissions",
    });
  }

  // Enforce one-action-per-cycle (simulation flag only)
  if (previews.some(p => p.permission === "ALLOWED")) {
    consumeCycle(); // marks cycle as consumed, still no execution
  }

  return previews;
}

