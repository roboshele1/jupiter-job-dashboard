let cachedSnapshot = null;
let lastFetchTs = 0;
const TTL_MS = 5_000;

export async function getPortfolioSnapshot() {
  const now = Date.now();

  if (cachedSnapshot && now - lastFetchTs < TTL_MS) {
    return cachedSnapshot;
  }

  const snapshot = await window.jupiter.ipc.invoke("portfolio:getSnapshot");

  cachedSnapshot = snapshot;
  lastFetchTs = now;

  return snapshot;
}

export function clearPortfolioCache() {
  cachedSnapshot = null;
  lastFetchTs = 0;
}

