// engine/confidence/history/confidenceHistoryStore.js

/**
 * CONFIDENCE HISTORY STORE — D12.6
 * --------------------------------
 * Logic-only persistence layer for confidence states.
 *
 * Purpose:
 * - Track historical confidence outcomes per symbol
 * - Enable escalation gates to verify persistence
 *
 * Constraints:
 * - Read/write in-memory only (no disk, no DB)
 * - Deterministic, testable, replaceable
 * - NO execution, NO side effects, NO trading
 */

const historyStore = new Map();

/**
 * Record a confidence outcome for a symbol.
 *
 * @param {Object} params
 * @param {string} params.symbol
 * @param {string} params.confidence
 * @param {string} params.regime
 * @param {number} [params.timestamp]
 */
export function recordConfidence({
  symbol,
  confidence,
  regime,
  timestamp = Date.now()
}) {
  if (!symbol || !confidence) {
    throw new Error("CONFIDENCE_HISTORY_INVALID_INPUT");
  }

  const existing = historyStore.get(symbol) || [];

  existing.push({
    confidence,
    regime,
    timestamp
  });

  historyStore.set(symbol, existing);

  return Object.freeze({
    symbol,
    recorded: confidence,
    totalRecords: existing.length
  });
}

/**
 * Retrieve confidence history for a symbol.
 *
 * @param {string} symbol
 * @returns {Array}
 */
export function getConfidenceHistory(symbol) {
  if (!symbol) return [];
  return historyStore.get(symbol) || [];
}

/**
 * Reset confidence history for a symbol.
 * Used when regime changes invalidate prior confirmations.
 *
 * @param {string} symbol
 */
export function resetConfidenceHistory(symbol) {
  historyStore.delete(symbol);

  return Object.freeze({
    symbol,
    reset: true
  });
}

/**
 * Retrieve the most recent N confidence entries.
 *
 * @param {string} symbol
 * @param {number} count
 * @returns {Array}
 */
export function getRecentConfidence(symbol, count = 1) {
  const history = historyStore.get(symbol) || [];
  if (history.length === 0) return [];

  return history.slice(-count);
}

/**
 * Debug / introspection helper (non-IPC).
 * Not exposed to UI.
 */
export function _dumpConfidenceHistory() {
  const snapshot = {};
  for (const [symbol, entries] of historyStore.entries()) {
    snapshot[symbol] = entries;
  }
  return snapshot;
}
