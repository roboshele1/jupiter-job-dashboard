/**
 * Snapshot Contract
 * -----------------
 * Strict validation for intelligence layer.
 */

export function validateSnapshot(snapshot) {
  if (!snapshot) return false;
  if (!Array.isArray(snapshot.holdings)) return false;

  return snapshot.holdings.every(h =>
    typeof h.symbol === "string" &&
    typeof h.value === "number"
  );
}

