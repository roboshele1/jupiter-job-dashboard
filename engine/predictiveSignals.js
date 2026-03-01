/**
 * Predictive Signals — Identifies breakouts and sector rotations
 */

export function detectBreakoutCandidates(signals, technicalData = {}) {
  const candidates = [];

  // Pattern 1: Higher lows + breaking resistance
  for (const signal of signals) {
    const tech = technicalData[signal.symbol] || {};
    
    // Simple breakout: price breaking 52-week resistance
    const isAbove52wHigh = tech.price > tech.high52w * 0.98;
    const momentumPositive = tech.rsi > 50 && tech.macd > tech.macdSignal;
    
    if (isAbove52wHigh && momentumPositive) {
      candidates.push({
        symbol: signal.symbol,
        reason: 'Breakout above 52-week resistance with positive momentum',
        confidence: 0.72,
        target: tech.high52w * 1.15,
      });
    }
  }

  return candidates;
}

export function detectSectorRotations(holdingsBySector = {}) {
  const rotations = [];

  // Track sector momentum shifts
  const sectors = Object.keys(holdingsBySector);
  
  for (const sector of sectors) {
    const holdings = holdingsBySector[sector];
    const avgMomentum = holdings.reduce((sum, h) => sum + (h.momentum || 0), 0) / holdings.length;
    
    // Rotation signal: sector avg momentum > 0.6
    if (avgMomentum > 0.6) {
      rotations.push({
        sector,
        momentum: avgMomentum,
        signal: 'positive', // or 'negative'
        message: `${sector} showing strong positive momentum — consider rotating into strength`,
      });
    }
  }

  return rotations.sort((a, b) => b.momentum - a.momentum);
}
