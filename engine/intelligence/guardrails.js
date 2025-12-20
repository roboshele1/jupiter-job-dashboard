/**
 * Guardrails
 * ----------
 * Prevents intelligence from mutating state.
 */

export function enforceReadOnly(fn) {
  return (...args) => {
    const snapshot = JSON.stringify(args);
    const result = fn(...args);
    if (JSON.stringify(args) !== snapshot) {
      throw new Error("Read-only violation detected");
    }
    return result;
  };
}

