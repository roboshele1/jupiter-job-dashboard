/**
 * Thesis Monitor — Watches for violations of your investment assumptions
 */

export async function monitorThesis(holdings, previousState = {}) {
  const alerts = [];

  for (const holding of holdings) {
    const symbol = holding.symbol;
    const prev = previousState[symbol] || {};

    try {
      // 1. Fetch current fundamentals
      const overview = await getOverviewData(symbol);
      if (!overview) continue;

      // 2. Margin compression check
      const marginDropped = prev.grossMargin && (overview.grossMargin - prev.grossMargin) < -0.02;
      if (marginDropped) {
        alerts.push({
          severity: 'warning',
          symbol,
          type: 'margin_compression',
          title: `${symbol} margins declining`,
          message: `Gross margin dropped from ${(prev.grossMargin * 100).toFixed(1)}% to ${(overview.grossMargin * 100).toFixed(1)}%`,
        });
      }

      // 3. Support level break (if price data available)
      if (prev.support && overview.currentPrice < prev.support) {
        alerts.push({
          severity: 'warning',
          symbol,
          type: 'support_break',
          title: `${symbol} broke support`,
          message: `Price ${overview.currentPrice.toFixed(2)} below support ${prev.support.toFixed(2)}`,
        });
      }

      // 4. Insider selling tracker (mock)
      if (prev.insiderBuying && !overview.recentInsiderBuys) {
        alerts.push({
          severity: 'info',
          symbol,
          type: 'insider_activity',
          title: `${symbol} insider activity slowed`,
          message: 'No recent insider buying detected',
        });
      }

    } catch (err) {
      console.error(`Error monitoring ${symbol}:`, err);
    }
  }

  return alerts;
}

async function getOverviewData(symbol) {
  // Mock for now — would call Alpha Vantage in production
  return {
    symbol,
    currentPrice: Math.random() * 500,
    grossMargin: 0.35 + (Math.random() - 0.5) * 0.1,
    recentInsiderBuys: Math.random() > 0.5,
  };
}
