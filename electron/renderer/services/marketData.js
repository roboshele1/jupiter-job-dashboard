// ~/JUPITER/electron/renderer/services/marketData.js

const { ipcRenderer } = window.electron;

/*
Renderer-side Market Data Bridge
- Calls the backend marketDataService
- Single source of truth
*/

export async function fetchLiveQuotes(symbols = []) {
  if (!Array.isArray(symbols) || symbols.length === 0) {
    throw new Error("No symbols provided to fetchLiveQuotes");
  }

  return ipcRenderer.invoke("market:getQuotes", symbols);
}

export async function fetchSingleQuote(symbol) {
  if (!symbol) {
    throw new Error("No symbol provided to fetchSingleQuote");
  }

  return ipcRenderer.invoke("market:getQuote", symbol);
}

