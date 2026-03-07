/**
 * Portfolio Optimizer
 * Calculates optimal allocation to hit $1M goal by 2037
 */

export function optimizeForGoal(currentPortfolio, targetAmount, targetYear, constraints = {}) {
  const now = new Date().getFullYear();
  const yearsToGoal = targetYear - now;
  
  const {
    minCoreAllocation = 0.6,      // Min 60% in core holdings
    maxMoonshotAllocation = 0.4,  // Max 40% in moonshots
    coreCAGR = 0.25,               // Core holdings expected CAGR
    moonshotCAGR = 0.6,            // Moonshots expected CAGR
  } = constraints;

  const currentValue = currentPortfolio.reduce((sum, h) => sum + (h.qty * h.price), 0);

  // Calculate required CAGR
  const requiredCAGR = Math.pow(targetAmount / currentValue, 1 / yearsToGoal) - 1;

  // Optimize allocation
  // EV = (coreAlloc * coreCAGR) + (moonshotAlloc * moonshotCAGR)
  // Find allocation that hits required CAGR while respecting constraints
  
  let bestAlloc = { coreAlloc: minCoreAllocation, moonshotAlloc: maxMoonshotAllocation };
  let closestCAGR = (minCoreAllocation * coreCAGR) + (maxMoonshotAllocation * moonshotCAGR);

  for (let core = minCoreAllocation; core <= (1 - maxMoonshotAllocation); core += 0.05) {
    const moonshot = 1 - core;
    if (moonshot < 0 || moonshot > maxMoonshotAllocation) continue;

    const portfolioCAGR = (core * coreCAGR) + (moonshot * moonshotCAGR);
    
    if (Math.abs(portfolioCAGR - requiredCAGR) < Math.abs(closestCAGR - requiredCAGR)) {
      closestCAGR = portfolioCAGR;
      bestAlloc = { coreAlloc: core, moonshotAlloc: moonshot };
    }
  }

  const coreValue = currentValue * bestAlloc.coreAlloc;
  const moonshotValue = currentValue * bestAlloc.moonshotAlloc;

  // Project forward
  const coreProjected = coreValue * Math.pow(1 + coreCAGR, yearsToGoal);
  const moonshotProjected = moonshotValue * Math.pow(1 + moonshotCAGR, yearsToGoal);
  const totalProjected = coreProjected + moonshotProjected;

  return {
    currentValue: currentValue.toFixed(2),
    targetAmount: targetAmount.toFixed(2),
    yearsToGoal,
    requiredCAGR: (requiredCAGR * 100).toFixed(1) + '%',
    optimalAllocation: {
      core: (bestAlloc.coreAlloc * 100).toFixed(0) + '%',
      moonshots: (bestAlloc.moonshotAlloc * 100).toFixed(0) + '%',
    },
    projectedOutcome: {
      coreValue: coreProjected.toFixed(2),
      moonshotValue: moonshotProjected.toFixed(2),
      totalValue: totalProjected.toFixed(2),
    },
    achievementProbability: calculateProbability(totalProjected, targetAmount),
    recommendation: getOptimizerRecommendation(totalProjected, targetAmount, bestAlloc),
  };
}

function calculateProbability(projected, target) {
  const ratio = projected / target;
  if (ratio >= 1.2) return '95%';
  if (ratio >= 1) return '75%';
  if (ratio >= 0.8) return '40%';
  return '10%';
}

function getOptimizerRecommendation(projected, target, alloc) {
  if (projected >= target * 1.1) {
    return `🚀 ON TRACK: ${(alloc.coreAlloc * 100).toFixed(0)}% core + ${(alloc.moonshotAlloc * 100).toFixed(0)}% moonshots gets you to \$1M`;
  }
  if (projected >= target * 0.9) {
    return `✓ POSSIBLE: Requires solid execution on moonshot thesis`;
  }
  return `⚠️ REQUIRES: Higher moonshot allocation or outperformance`;
}
