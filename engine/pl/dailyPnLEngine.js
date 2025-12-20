// engine/pl/dailyPnLEngine.js
export function computeDailyPnL(breakdown) {
  let totalPnL = 0;

  breakdown.forEach(b => {
    if (typeof b.pnl === 'number') {
      totalPnL += b.pnl;
    }
  });

  return {
    dailyPnL: +totalPnL.toFixed(2),
    ts: Date.now()
  };
}

