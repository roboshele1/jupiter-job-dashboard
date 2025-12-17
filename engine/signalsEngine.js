// engine/signalsEngine.js
// ENGINE-FIRST SNAPSHOT — SIGNALS

function getSnapshot() {
  return {
    timestamp: new Date().toISOString(),
    signals: [] // empty = no signals yet (truth, not placeholder)
  };
}

module.exports = {
  getSnapshot
};

