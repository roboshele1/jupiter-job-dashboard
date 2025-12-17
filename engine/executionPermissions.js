/**
 * JUPITER — Execution Permissions (SIMULATED)
 * Phase 8 Step 1
 *
 * IMPORTANT:
 * - No real execution
 * - Explicit permissions required
 * - Single-cycle gate
 */

const PERMISSIONS_KEY = "JUPITER_EXECUTION_PERMISSIONS";

const DEFAULT_PERMISSIONS = {
  enabled: false,          // hard off by default
  mode: "SIMULATION",      // SIMULATION | LIVE (LIVE not implemented)
  allowRebalance: false,
  allowDCA: false,
  allowReduce: false,
  lastEvaluated: null,
  cycleConsumed: false,    // one-action-per-cycle rule
};

function loadPermissions() {
  try {
    const raw = localStorage.getItem(PERMISSIONS_KEY);
    return raw ? { ...DEFAULT_PERMISSIONS, ...JSON.parse(raw) } : { ...DEFAULT_PERMISSIONS };
  } catch {
    return { ...DEFAULT_PERMISSIONS };
  }
}

function savePermissions(state) {
  localStorage.setItem(
    PERMISSIONS_KEY,
    JSON.stringify({ ...state, lastEvaluated: Date.now() })
  );
}

export function getExecutionPermissions() {
  return loadPermissions();
}

export function setExecutionPermissions(patch = {}) {
  const current = loadPermissions();
  const next = { ...current, ...patch };
  savePermissions(next);
  return next;
}

export function consumeCycle() {
  const current = loadPermissions();
  if (current.cycleConsumed) return false;
  const next = { ...current, cycleConsumed: true };
  savePermissions(next);
  return true;
}

export function resetCycle() {
  const current = loadPermissions();
  const next = { ...current, cycleConsumed: false };
  savePermissions(next);
  return next;
}

