// engine/growthEngine.js
// ENGINE-FIRST SNAPSHOT — GROWTH ENGINE

function getSnapshot() {
  return {
    timestamp: new Date().toISOString(),
    projections: [] // empty = no growth projections yet (truth)
  };
}

module.exports = {
  getSnapshot
};

