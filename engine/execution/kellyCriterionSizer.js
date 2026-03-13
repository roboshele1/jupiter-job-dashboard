/**
 * KELLY_CRITERION_POSITION_SIZER_V1
 * ---------------------------------
 * Purpose:
 * - Convert conviction scores into optimal position sizes
 * - Implements fractional Kelly (conservative 25% Kelly for safety)
 * - Ensures you never over-leverage on any single position
 */

const FRACTIONAL_KELLY = 0.25;
const MAX_POSITION_PCT = 15;
const MIN_POSITION_PCT = 1;

const CONVICTION_TO_WIN_PROBABILITY = Object.freeze({
  AVOID: 0.30,
  HOLD: 0.50,
  BUY: 0.65,
  BUY_MORE: 0.75
});

const CONVICTION_TO_WIN_LOSS_RATIO = Object.freeze({
  AVOID: 0.5,
  HOLD: 1.0,
  BUY: 1.5,
  BUY_MORE: 2.0
});

function calculateKelly({ winProbability, winLossRatio }) {
  const p = winProbability;
  const q = 1 - p;
  const b = winLossRatio;
  
  const kelly = (b * p - q) / b;
  const fractionalKelly = kelly * FRACTIONAL_KELLY;
  
  return Math.max(0, fractionalKelly * 100);
}

export function calculatePositionSize({
  symbol,
  confidence,
  portfolioValue,
  currentPositionValue = 0,
  convictionScore = null,
}) {
  if (!symbol || typeof symbol !== 'string') {
    throw new Error('INVALID_INPUT: symbol required');
  }
  
  if (!confidence || !CONVICTION_TO_WIN_PROBABILITY[confidence]) {
    throw new Error(`INVALID_INPUT: confidence must be one of ${Object.keys(CONVICTION_TO_WIN_PROBABILITY).join(', ')}`);
  }
  
  if (typeof portfolioValue !== 'number' || portfolioValue <= 0) {
    throw new Error('INVALID_INPUT: portfolioValue must be positive number');
  }
  
  if (confidence === 'AVOID') {
    return Object.freeze({
      symbol,
      confidence,
      optimalPositionPct: 0,
      optimalPositionValue: 0,
      currentPositionValue,
      suggestedAction: 'EXIT_OR_AVOID',
      reasoning: 'Kelly Criterion suggests zero exposure at AVOID confidence',
      kellyPct: 0,
      winProbability: CONVICTION_TO_WIN_PROBABILITY.AVOID,
    });
  }
  // CONVICTION ADJUSTMENT: Intentional bias to differentiate thesis quality
  // Conviction adds 0-10% to base win probability (capped at 85% max)
  // This is NOT "pure Kelly" but represents business logic: stronger conviction = larger sizing

  
  let winProbability = CONVICTION_TO_WIN_PROBABILITY[confidence];
  const winLossRatio = CONVICTION_TO_WIN_LOSS_RATIO[confidence];
  
  if (typeof convictionScore === 'number' && convictionScore >= 0 && convictionScore <= 1) {
    winProbability = winProbability + (convictionScore * 0.1);
    winProbability = Math.min(0.85, winProbability);
  }
  
  const kellyPct = calculateKelly({ winProbability, winLossRatio });
  
  let targetPct = Math.min(kellyPct, MAX_POSITION_PCT);
  targetPct = Math.max(targetPct, MIN_POSITION_PCT);
  
  const optimalPositionValue = (portfolioValue * targetPct) / 100;
  const currentPositionPct = (currentPositionValue / portfolioValue) * 100;
  
  let suggestedAction = 'HOLD';
  if (currentPositionPct < targetPct * 0.8) {
    suggestedAction = 'ADD';
  } else if (currentPositionPct > targetPct * 1.2) {
    suggestedAction = 'TRIM';
  }
  
  if (confidence === 'HOLD' && currentPositionPct > MIN_POSITION_PCT * 1.5) {
    suggestedAction = 'TRIM_TO_MINIMAL';
  }
  
  return Object.freeze({
    symbol,
    confidence,
    optimalPositionPct: Number(targetPct.toFixed(2)),
    optimalPositionValue: Number(optimalPositionValue.toFixed(2)),
    currentPositionPct: Number(currentPositionPct.toFixed(2)),
    currentPositionValue,
    suggestedAction,
    deltaValue: Number((optimalPositionValue - currentPositionValue).toFixed(2)),
    deltaPct: Number((targetPct - currentPositionPct).toFixed(2)),
    reasoning: `Kelly Criterion (${FRACTIONAL_KELLY * 100}% fractional) suggests ${targetPct.toFixed(1)}% position based on ${(winProbability * 100).toFixed(0)}% win probability and ${winLossRatio}:1 win/loss ratio`,
    kellyPct: Number(kellyPct.toFixed(2)),
    winProbability: Number(winProbability.toFixed(3)),
    winLossRatio,
    constraints: {
      maxPositionPct: MAX_POSITION_PCT,
      minPositionPct: MIN_POSITION_PCT,
      fractionalKelly: FRACTIONAL_KELLY
    }
  });
}

export function calculatePortfolioPositions({
  decisions,
  portfolioValue,
  currentPositions = []
}) {
  if (!Array.isArray(decisions) || decisions.length === 0) {
    throw new Error('INVALID_INPUT: decisions must be non-empty array');
  }
  
  const positionsMap = new Map();
  for (const pos of currentPositions) {
    positionsMap.set(pos.symbol, pos.value || 0);
  }
  
  const positions = decisions.map(decision => {
    return calculatePositionSize({
      symbol: decision.symbol,
      confidence: decision.confidence || decision.action,
      portfolioValue,
      currentPositionValue: positionsMap.get(decision.symbol) || 0,
      convictionScore: decision.conviction || decision.convictionScore
    });
  });
  
  const totalOptimalExposure = positions.reduce((sum, p) => sum + p.optimalPositionValue, 0);
  const totalCurrentExposure = positions.reduce((sum, p) => sum + p.currentPositionValue, 0);
  const cashReserve = portfolioValue - totalOptimalExposure;
  
  return Object.freeze({
    asOf: Date.now(),
    portfolioValue,
    positions,
    summary: Object.freeze({
      totalOptimalExposure: Number(totalOptimalExposure.toFixed(2)),
      totalCurrentExposure: Number(totalCurrentExposure.toFixed(2)),
      optimalCashReserve: Number(cashReserve.toFixed(2)),
      optimalCashPct: Number(((cashReserve / portfolioValue) * 100).toFixed(2)),
      numPositions: positions.length,
      numAdds: positions.filter(p => p.suggestedAction === 'ADD').length,
      numTrims: positions.filter(p => p.suggestedAction === 'TRIM' || p.suggestedAction === 'TRIM_TO_MINIMAL').length,
      numHolds: positions.filter(p => p.suggestedAction === 'HOLD').length,
    })
  });
}

export function checkPortfolioHeat({ positions, maxTotalHeatPct = 50 }) {
  const totalHeat = positions.reduce((sum, p) => {
    const heat = p.optimalPositionPct * (1 - p.winProbability);
    return sum + heat;
  }, 0);
  
  const isOverheated = totalHeat > maxTotalHeatPct;
  
  return Object.freeze({
    totalHeat: Number(totalHeat.toFixed(2)),
    maxAllowedHeat: maxTotalHeatPct,
    isOverheated,
    heatStatus: isOverheated ? 'OVERHEATED' : totalHeat > maxTotalHeatPct * 0.8 ? 'ELEVATED' : 'NORMAL',
    recommendation: isOverheated 
      ? 'Reduce position sizes or increase conviction quality before adding exposure'
      : 'Portfolio heat within acceptable parameters'
  });
}
