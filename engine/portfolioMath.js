// engine/portfolioMath.js
// Canonical portfolio math engine (v1)

function buildPortfolioSnapshot({ assets, timestamp = Date.now() }) {
  let totalValue = 0;

  const holdings = assets.map(a => {
    const marketValue = Number((a.amount * a.price).toFixed(2));
    totalValue += marketValue;

    return {
      symbol: a.symbol,
      amount: a.amount,
      price: a.price,
      marketValue,
    };
  });

  return {
    timestamp,
    totalValue: Number(totalValue.toFixed(2)),
    holdings,
  };
}

function computeDailyPL({ currentSnapshot, previousSnapshot }) {
  if (!previousSnapshot) {
    return {
      dailyPL: 0,
      dailyPLPercent: 0,
    };
  }

  const diff = currentSnapshot.totalValue - previousSnapshot.totalValue;
  const pct =
    previousSnapshot.totalValue === 0
      ? 0
      : (diff / previousSnapshot.totalValue) * 100;

  return {
    dailyPL: Number(diff.toFixed(2)),
    dailyPLPercent: Number(pct.toFixed(2)),
  };
}

module.exports = {
  buildPortfolioSnapshot,
  computeDailyPL,
};

