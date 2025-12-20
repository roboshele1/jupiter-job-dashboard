// FULL REPLACEMENT — CommonJS ONLY (no ES exports)

const holdings = require("../data/holdings");

let state = {
  positions: [],
};

function loadHoldings() {
  if (!Array.isArray(holdings)) {
    throw new Error("Holdings data must be an array");
  }
  state.positions = holdings;
  return state.positions;
}

function getPositions() {
  return state.positions;
}

module.exports = {
  loadHoldings,
  getPositions,
};

