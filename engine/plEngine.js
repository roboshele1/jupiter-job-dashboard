// engine/plEngine.js

function calculatePL(currentValue, costBasis) {
  const pnl = currentValue - costBasis;
  const pnlPct = costBasis > 0 ? (pnl / costBasis) * 100 : 0;

  return {
    pnl,
    pnlPct,
  };
}

module.exports = {
  calculatePL,
};

