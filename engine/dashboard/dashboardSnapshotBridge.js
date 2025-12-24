import { readPortfolioSnapshot } from '../portfolio/portfolioCache.js';

export async function buildDashboardSnapshot() {
  const portfolio = readPortfolioSnapshot();

  if (!portfolio) {
    return null;
  }

  const { totals, positions, currency, _asOf } = portfolio;

  const allocationMap = {};
  for (const p of positions) {
    allocationMap[p.assetClass] =
      (allocationMap[p.assetClass] || 0) + p.liveValue;
  }

  const allocationTotal = Object.values(allocationMap).reduce((a, b) => a + b, 0);

  const allocations = Object.entries(allocationMap).map(([label, value]) => ({
    label,
    pct: allocationTotal === 0 ? 0 : Math.round((value / allocationTotal) * 100),
  }));

  const topHoldings = [...positions]
    .sort((a, b) => b.liveValue - a.liveValue)
    .slice(0, 5)
    .map(p => ({
      symbol: p.symbol,
      qty: p.qty,
    }));

  const dailyValue = totals.liveValue - totals.snapshotValue;
  const dailyPct =
    totals.snapshotValue === 0
      ? 0
      : (dailyValue / totals.snapshotValue) * 100;

  return {
    contract: 'DASHBOARD_SNAPSHOT_V1',
    asOf: _asOf,
    currency,
    source: 'PORTFOLIO_ENGINE',

    totals: {
      portfolioValue: totals.liveValue,
      snapshotValue: totals.snapshotValue,
    },

    dailyPL: {
      value: Number(dailyValue.toFixed(2)),
      pct: Number(dailyPct.toFixed(2)),
      state:
        dailyValue > 0 ? 'GAIN' : dailyValue < 0 ? 'LOSS' : 'FLAT',
    },

    allocations,
    topHoldings,

    systemStatus: {
      marketData: 'LIVE',
      pricingSource: 'ENGINE',
    },
  };
}

