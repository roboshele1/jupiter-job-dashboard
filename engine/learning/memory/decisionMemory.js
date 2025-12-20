// engine/learning/memory/decisionMemory.js

const GLOBAL_KEY = '__JUPITER_DECISION_MEMORY__';

if (!globalThis[GLOBAL_KEY]) {
  globalThis[GLOBAL_KEY] = [];
}

export function recordDecision(decision) {
  globalThis[GLOBAL_KEY].push({
    ...decision,
    ts: Date.now()
  });
}

export function getDecisionHistory() {
  return globalThis[GLOBAL_KEY];
}

