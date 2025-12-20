/**
 * V2 Feature Extractor
 * Converts raw portfolio snapshots into math-only feature vectors.
 * NO predictions. NO decisions.
 */

function extractFeatures(snapshot) {
  if (!snapshot || !snapshot.positions) return null;

  const totalValue = snapshot.totalValue || 0;
  const dailyPL = snapshot.dailyPL || 0;

  const concentration = {};
  snapshot.positions.forEach(p => {
    concentration[p.symbol] = p.value / totalValue || 0;
  });

  return {
    totalValue,
    dailyPL,
    volatilityProxy: Math.abs(dailyPL / (totalValue || 1)),
    concentration,
    positionCount: snapshot.positions.length
  };
}

module.exports = { extractFeatures };

