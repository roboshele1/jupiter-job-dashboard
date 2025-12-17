// engine/discoveryEngine.js
// ENGINE-FIRST SNAPSHOT — DISCOVERY LAB

function getSnapshot() {
  return {
    timestamp: new Date().toISOString(),
    candidates: [] // empty = no discoveries yet (truth)
  };
}

module.exports = {
  getSnapshot
};

