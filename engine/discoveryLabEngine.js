// engine/discoveryLabEngine.js
// Discovery Lab Engine — read-only, deterministic, IPC-safe
// Purpose: surface candidate assets & ideas without touching Portfolio/Dashboard

function nowIso() {
  return new Date().toISOString();
}

function getDiscoverySnapshot() {
  return {
    status: "ok",
    ts: nowIso(),
    universe: [
      { symbol: "NVDA", category: "Equity", thesis: "AI infrastructure leader" },
      { symbol: "ASML", category: "Equity", thesis: "Semiconductor equipment moat" },
      { symbol: "BTC", category: "Crypto", thesis: "Digital scarcity / macro hedge" },
      { symbol: "ETH", category: "Crypto", thesis: "Smart contract settlement layer" }
    ],
    meta: {
      source: "discoveryLabEngine",
      readOnly: true
    }
  };
}

module.exports = {
  getDiscoverySnapshot
};

