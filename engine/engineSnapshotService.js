const { writeSnapshot, readSnapshot } = require("./snapshots/snapshotIndex");

function persistEngineSnapshot(engineName, payload) {
  writeSnapshot(engineName, {
    timestamp: Date.now(),
    payload,
  });
}

function loadEngineSnapshot(engineName) {
  const snap = readSnapshot(engineName);
  return snap ? snap.payload : null;
}

module.exports = {
  persistEngineSnapshot,
  loadEngineSnapshot,
};

