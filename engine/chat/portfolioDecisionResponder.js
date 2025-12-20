// engine/chat/portfolioDecisionResponder.js
import { projectPortfolio } from '../decision/paths/portfolioPath.js';

export function respondPortfolioDecision(query) {
  const { assets, months } = query;

  const result = projectPortfolio({ assets, months });

  return {
    answer:
      `Projected portfolio value in ${months} months:\n` +
      result.assets
        .map(
          a =>
            `• ${a.symbol}: $${a.projectedValue.toLocaleString()}`
        )
        .join('\n') +
      `\n\nTotal: $${result.totalFutureValue.toLocaleString()}`,
    meta: {
      engine: 'multi-asset-decision',
      deterministic: true
    }
  };
}

