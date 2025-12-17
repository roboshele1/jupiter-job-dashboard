/*
 Phase T — Step 1
 Learning & Adaptation Hooks (Registry)

 Purpose:
 - Record outcomes of growth/discovery signals
 - Track wins, misses, false positives
 - Deterministic storage (no ML yet)
 - Foundation for future learning loops
*/

const learningRegistry = {
  signals: [],
};

export function recordSignalOutcome({
  symbol,
  signalType,
  confidence,
  outcome, // "win" | "miss" | "pending"
  timestamp = new Date().toISOString(),
}) {
  learningRegistry.signals.push({
    symbol,
    signalType,
    confidence,
    outcome,
    timestamp,
  });
}

export function getLearningStats() {
  const total = learningRegistry.signals.length;
  const wins = learningRegistry.signals.filter(
    (s) => s.outcome === "win"
  ).length;
  const misses = learningRegistry.signals.filter(
    (s) => s.outcome === "miss"
  ).length;
  const pending = total - wins - misses;

  return {
    totalSignals: total,
    wins,
    misses,
    pending,
    winRate: total ? (wins / total).toFixed(2) : "0.00",
  };
}

export function getAllSignals() {
  return [...learningRegistry.signals];
}

