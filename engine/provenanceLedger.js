/**
 * JUPITER — Decision Provenance Ledger
 * Phase 10 Step 1
 *
 * Immutable, append-only audit record.
 * NO deletes. NO edits. EVER.
 */

const LEDGER_KEY = "JUPITER_PROVENANCE_LEDGER";

function loadLedger() {
  try {
    const raw = localStorage.getItem(LEDGER_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLedger(entries) {
  localStorage.setItem(LEDGER_KEY, JSON.stringify(entries));
}

/**
 * Append a provenance record.
 * @param {Object} record
 */
export function recordProvenance(record) {
  const ledger = loadLedger();

  const entry = Object.freeze({
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    decision: record.decision || "UNKNOWN",
    regime: record.regime || "UNKNOWN",
    confidence: record.confidence ?? null,
    inputs: record.inputs || {},
    rationale: record.rationale || "",
    source: record.source || "SYSTEM",
  });

  ledger.push(entry);
  saveLedger(ledger);

  return entry;
}

/**
 * Read-only access to provenance ledger.
 */
export function getProvenanceLedger() {
  return loadLedger().slice(); // defensive copy
}

