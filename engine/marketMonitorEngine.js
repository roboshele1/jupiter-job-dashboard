// engine/marketMonitorEngine.js
// ENGINE-FIRST SNAPSHOT — MARKET MONITOR

function getSnapshot() {
  return {
    timestamp: new Date().toISOString(),
    markets: [] // empty = no markets tracked yet (truth)
  };
}

module.exports = {
  getSnapshot
};

