// JUPITER — System State Persistence Layer
// Phase 5 Step 1 — Authoritative Memory Store

const STORAGE_KEY = "JUPITER_SYSTEM_STATE";

const DEFAULT_STATE = {
  version: "5.1",
  timestamp: Date.now(),

  risk: {
    score: 0,
    level: "UNKNOWN",
    regime: "NEUTRAL"
  },

  exposure: {
    crypto: 0,
    equity: 0,
    concentrationTop1: 0
  },

  strategy: {
    decision: "HOLD",
    dcaPosture: "ACTIVE",
    confidence: "MEDIUM"
  },

  alerts: [],
  lastAction: null
};

// --- Internal helpers ---
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_STATE };
    return { ...DEFAULT_STATE, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_STATE };
  }
}

function saveState(state) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      ...state,
      timestamp: Date.now()
    })
  );
}

// --- Public API ---
export function getSystemState() {
  return loadState();
}

export function updateSystemState(patch = {}) {
  const current = loadState();
  const next = {
    ...current,
    ...patch
  };
  saveState(next);
  return next;
}

export function resetSystemState() {
  saveState({ ...DEFAULT_STATE });
  return { ...DEFAULT_STATE };
}

