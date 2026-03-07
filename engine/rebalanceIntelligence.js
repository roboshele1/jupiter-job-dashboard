/**
 * Rebalance Intelligence
 * Recommends thesis-driven rebalancing to stay on track for $1M
 */

export function getRebalanceRecommendations(holdings, targets = {}, constraints = {}) {
  const recommendations = [];
  const totalValue = holdings.reduce((sum, h) => sum + (h.qty * h.price), 0);

  for (const holding of holdings) {
    const holdingValue = holding.qty * holding.price;
    const currentAlloc = holdingValue / totalValue;
    const targetAlloc = targets[holding.symbol] || 0.1;

    const deviation = Math.abs(currentAlloc - targetAlloc);

    // Recommendation 1: Trim winners to rebalance
    if (holding.gainPercent > 50 && currentAlloc > targetAlloc * 1.2) {
      const trimAmount = (currentAlloc - (targetAlloc * 1.05)) * totalValue;
      recommendations.push({
        symbol: holding.symbol,
        action: 'TRIM_WINNER',
        reason: `${holding.symbol} up ${holding.gainPercent}%. Trim ${trimAmount.toFixed(0)} and rotate into moonshots`,
        priority: 'HIGH',
        amount: trimAmount.toFixed(2),
      });
    }

    // Recommendation 2: Add to underweight thesis stocks
    if (currentAlloc < targetAlloc * 0.8 && holding.thesisScore > 0.7) {
      const addAmount = ((targetAlloc * 1.05) - currentAlloc) * totalValue;
      recommendations.push({
        symbol: holding.symbol,
        action: 'ADD_THESIS',
        reason: `${holding.symbol} underweight. Strong thesis score. Add ${addAmount.toFixed(0)}`,
        priority: 'MEDIUM',
        amount: addAmount.toFixed(2),
      });
    }

    // Recommendation 3: Harvest underperformers
    if (holding.gainPercent < -20 && deviation > 0.05) {
      recommendations.push({
        symbol: holding.symbol,
        action: 'REVIEW_THESIS',
        reason: `${holding.symbol} down ${Math.abs(holding.gainPercent)}%. Thesis broken?`,
        priority: 'HIGH',
      });
    }
  }

  return {
    recommendations: recommendations.sort((a, b) => 
      (a.priority === 'HIGH' ? 0 : 1) - (b.priority === 'HIGH' ? 0 : 1)
    ),
    rebalanceSummary: `${recommendations.filter(r => r.action === 'TRIM_WINNER').length} trims, ${recommendations.filter(r => r.action === 'ADD_THESIS').length} adds recommended`,
  };
}
