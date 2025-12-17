/**
 * JUPITER — Decision Log (Append-Only)
 * Phase 5 Step 3
 *
 * This module records all system decisions with full context.
 * It is intentionally simple, deterministic, and immutable.
 */

const STORAGE_KEY = "JUPITER_DECISION_LOG";

/**
 * Load full decision log
 */
export function loadDecisionLog() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error("Failed to load decision log:", err);
    return [];
  }
}

/**
 * Append a new decision entry
 */
export function logDecision({
  regime,
  riskScore,
  decision,
  confidence,
  reason
}) {
  const log = loadDecisionLog();

  const entry = {
    timestamp: new Date().toISOString(),
    regime,
    riskScore,
    decision,
    confidence,
    reason
  };

  log.push(entry);

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(log));
  } catch (err) {
    console.error("Failed to persist decision log:", err);
  }

  return entry;
}

