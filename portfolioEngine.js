import { getFrozenPositions } from './frozenPositions.js';
import * as live from '../../renderer/engine/market/liveSnapshotServer.js';

export async function getPortfolioSnapshot() {
  const frozen = await getFrozenPositions();

  // 🔑 GUARANTEED FUNCTION ACCESS
  if (typeof live.getLivePrices !== 'function') {
    throw new Error('getLivePrices is not a function');
  }

  const prices = await live.getLivePrices(
    frozen.map(p => p.symbol)
  );

  let totalValueUSD = 0;

  const positions = frozen.map(p => {
    const liveUSD = prices[p.symbol] ?? 0;
    const deltaUSD = liveUSD - p.costUSD;

    totalValueUSD += liveUSD;

    return {
      symbol: p.symbol,
      costUSD: p.costUSD,
      liveUSD,
      deltaUSD
    };
  });

  return {
    status: 'OK',
    contract: 'PORTFOLIO_SNAPSHOT_V1',
    positions,
    totals: {
      valueUSD: totalValueUSD
    },
    warnings: []
  };
}

