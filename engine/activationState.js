/**
 * JUPITER — Activation Architecture
 * Phase 9 Step 1
 *
 * Defines system activation states and kill-switch logic.
 * NO execution is performed here.
 */

const STORAGE_KEY = "JUPITER_ACTIVATION_STATE";

export const ACTIVATION_STATES = {
  DISABLED: "DISABLED",   // default, safe
  ARMED: "ARMED",         // ready, but not executing
  LIVE: "LIVE",           // execution-capable (not implemented)
  KILLED: "KILLED",       // emergency stop
};

const DEFAULT_STATE = {
  state: ACTIVATION_STATES.DISABLED,
  lastChanged: Date.now(),
  reason: "Initial safe default",
};

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULT_STATE, ...JSON.parse(raw) } : { ...DEFAULT_STATE };
  } catch {
    return { ...DEFAULT_STATE };
  }
}

function saveState(next) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ ...next, lastChanged: Date.now() })
  );
}

export function getActivationState() {
  return loadState();
}

export function setActivationState(nextState, reason = "") {
  const current = loadState();

  // Kill-switch is terminal until manual reset
  if (current.state === ACTIVATION_STATES.KILLED) {
    return current;
  }

  // Only allow known states
  if (!Object.values(ACTIVATION_STATES).includes(nextState)) {
    return current;
  }

  const next = {
    state: nextState,
    reason: reason || `Transition to ${nextState}`,
  };

  saveState(next);
  return next;
}

export function killSwitch(reason = "Manual kill-switch activated") {
  const next = {
    state: ACTIVATION_STATES.KILLED,
    reason,
  };
  saveState(next);
  return next;
}

export function resetActivation(reason = "Manual reset") {
  const next = {
    state: ACTIVATION_STATES.DISABLED,
    reason,
  };
  saveState(next);
  return next;
}

