// renderer/services/marketData.js

const isElectron =
  typeof window !== "undefined" &&
  window.electron &&
  window.electron.ipcRenderer;

/**
 * Market data fetch
 * - Electron → IPC ONLY
 * - Browser/Vite → explicitly disabled (no mocks, no HTTP)
 */
export async function fetchMarketData(payload) {
  if (!isElectron) {
    throw new Error(
      "Market data is only available via Electron IPC (no HTTP, no Vite mode)"
    );
  }

  return window.electron.ipcRenderer.invoke(
    "market-data:fetch",
    payload
  );
}

