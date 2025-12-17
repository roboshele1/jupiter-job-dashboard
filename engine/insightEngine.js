// engine/insightEngine.js
// ENGINE-FIRST SNAPSHOT — INSIGHTS

function getSnapshot() {
  return {
    timestamp: new Date().toISOString(),
    insights: [] // empty = no insights yet (truth)
  };
}

module.exports = {
  getSnapshot
};

