// DAILY snapshot persistence (T-1 vs T-0)
// UI-only utility — NO engine mutation

const SNAPSHOT_KEY = "JUPITER_DAILY_SNAPSHOT";

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

export function loadDailySnapshot() {
  try {
    const raw = localStorage.getItem(SNAPSHOT_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveDailySnapshot(data) {
  const snapshot = {
    date: todayKey(),
    ...data,
  };
  localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(snapshot));
  return snapshot;
}

export function getOrCreateDailySnapshot(currentTotals) {
  const existing = loadDailySnapshot();
  const today = todayKey();

  if (existing && existing.date === today) {
    return existing;
  }

  // Create new T-1 baseline
  return saveDailySnapshot({
    totalValue: currentTotals.totalValue,
  });
}

