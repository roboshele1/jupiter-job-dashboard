/**
 * CHAT_MEMORY_STORE_V1
 * -------------------
 * Persistent, read-only intelligence memory.
 * No learning, no preference, no reinforcement.
 * Used only for comparison, drift detection, and audit.
 */

const MAX_ENTRIES = 50;
const memory = [];

export function recordChatIntelligence(entry) {
  memory.push({
    timestamp: Date.now(),
    intent: entry.intent,
    confidence: entry.confidence,
    synthesisState: entry.synthesisState,
    sources: entry.sources,
  });

  if (memory.length > MAX_ENTRIES) {
    memory.shift();
  }
}

export function getChatMemory() {
  return [...memory];
}

export function getRecentMemory(n = 5) {
  return memory.slice(-n);
}

export function detectSynthesisDrift() {
  if (memory.length < 2) return null;

  const recent = memory.slice(-5);
  const states = recent.map(m => m.synthesisState);

  const uniqueStates = new Set(states);
  return {
    observedStates: [...uniqueStates],
    unstable: uniqueStates.size > 1,
    samples: recent.length,
  };
}
