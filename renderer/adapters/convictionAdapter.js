// renderer/adapters/convictionAdapter.js
// UI-only conviction clock (persistent, deterministic, zero IPC)

const STORAGE_KEY = "JUPITER_CONVICTION_START_TS_V1";

function getOrInitStartTs() {
  let ts = Number(localStorage.getItem(STORAGE_KEY));
  if (!Number.isFinite(ts) || ts <= 0) {
    ts = Date.now();
    localStorage.setItem(STORAGE_KEY, String(ts));
  }
  return ts;
}

function daysSince(ts) {
  const diffMs = Date.now() - ts;
  return Math.max(0, Math.floor(diffMs / 86400000));
}

/**
 * Applies deterministic conviction days to rows.
 * Does NOT mutate engine data.
 */
export function applyConvictionDays(rows = []) {
  const startTs = getOrInitStartTs();
  const days = daysSince(startTs);

  return rows.map((r) => ({
    ...r,
    daysInState: days,
  }));
}

/**
 * DEBUG helper (optional)
 * window.__RESET_CONVICTION_CLOCK__()
 */
export function resetConvictionClock() {
  localStorage.removeItem(STORAGE_KEY);
}
