import { getFrozenPositions } from './frozenPositions.js';
import * as live from '../../renderer/engine/market/liveSnapshotServer.js';

export async function getPortfolioSnapshot() {
  // 1. Load frozen positions
  const frozen = await getFrozenPositions();

  // 2. Guard: live prices function must exist
  if (typeof live.getLivePrices !== 'function') {
    throw new Error('getLivePrices is not a function');
  }

  // 3. Fetch live prices
  const rawPrices = await live.getLivePrices(
    frozen.map(p => p.symbol)
  );

  // 4. Normalize prices (FIXED)
  const prices = {};
  for (const symbol of Object.keys(rawPrices || {})) {
    const v = rawPrices[symbol];
    prices[symbol] =
      typeof v === 'number'
        ? v
        : v?.price ?? v?.usd ?? 0;
  }

  // 5. Build portfolio
  let totalValueUSD = 0;

  const positions = frozen.map(p => {
    const liveUSD = prices[p.symbol] ?? 0;
    const deltaUSD = liveUSD - p.costUSD;
    totalValueUSD += liveUSD;

    return {
      symbol: p.symbol,
      costUSD: p.costUSD,
      liveUSD,
      deltaUSD,
    };
  });

  return {
    status: 'OK',
    contract: 'PORTFOLIO_SNAPSHOT_V1',
    positions,
    totals: { valueUSD: totalValueUSD },
    warnings: [],
  };
}

