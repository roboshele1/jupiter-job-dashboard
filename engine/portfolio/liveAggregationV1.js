// engine/portfolio/liveAggregationV1.js
import { getLivePrices } from '../../renderer/engine/market/liveSnapshotServer.js';

export async function applyLiveAggregation(snapshot) {
  if (!snapshot || !Array.isArray(snapshot.positions)) {
    throw new Error('Invalid snapshot contract');
  }

  const symbols = snapshot.positions.map(p => p.symbol);
  const livePrices = await getLivePrices(symbols);

  let totalValueUSD = 0;
  let totalDeltaUSD = 0;

  const positions = snapshot.positions.map(p => {
    const livePrice = livePrices[p.symbol]?.price ?? 0;
    const liveValue = p.quantity * livePrice;
    const delta = liveValue - p.costUSD;

    totalValueUSD += liveValue;
    totalDeltaUSD += delta;

    return {
      ...p,
      liveValue,
      delta,
      priceStatus: livePrice > 0 ? 'OK' : 'STALE'
    };
  });

  return {
    ...snapshot,
    status: 'OK',
    positions,
    totals: {
      valueUSD: totalValueUSD,
      deltaUSD: totalDeltaUSD
    }
  };
}

