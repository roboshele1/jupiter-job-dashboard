// engine/decision/constraintEngine.js
// Computes available decision space before any BUY/ADD signal is allowed through.

export function computeConstraints(positions, kellyResults) {
  const totalValue   = positions.reduce((s, p) => s + (p.liveValue || 0), 0);
  const totalHeat    = kellyResults.heatCheck.totalHeat;
  const isOverheated = kellyResults.heatCheck.isOverheated;

  const trimCapital = kellyResults.actions
    .filter(a => a.action === 'TRIM' || a.action === 'TRIM_TO_MINIMAL')
    .reduce((s, a) => s + Math.abs(a.deltaValue), 0);

  const heatBudget = Math.max(0, 50 - totalHeat);
  const buyBlocked = isOverheated;

  const headroom = {};
  for (const a of kellyResults.actions) {
    headroom[a.symbol] = {
      canAdd:     a.action === 'ADD' && !buyBlocked,
      mustTrim:   a.action === 'TRIM' || a.action === 'TRIM_TO_MINIMAL',
      mustExit:   a.action === 'EXIT_OR_AVOID',
      deltaValue: a.deltaValue,
      deltaPct:   a.deltaPct,
    };
  }

  return {
    totalValue, totalHeat, heatBudget,
    buyBlocked, trimCapital,
    headroom,
    timestamp: Date.now()
  };
}
