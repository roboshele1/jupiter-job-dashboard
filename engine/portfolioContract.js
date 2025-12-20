/**
 * CANONICAL PORTFOLIO SNAPSHOT CONTRACT (FROZEN FOR v1)
 * This is the ONLY shape the UI is allowed to consume.
 */

function createEmptySnapshot(source = "engine") {
  return {
    timestamp: Date.now(),
    source,
    totalValue: 0,
    positions: [] // [{ symbol, quantity, price, value }]
  };
}

module.exports = {
  createEmptySnapshot
};

