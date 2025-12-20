// renderer/engine/portfolioEngine.js

// Deterministic mock prices (V1 stability)
export const MOCK_PRICES = {
  ASML: 720,
  NVDA: 850,
  AVGO: 1200,
  BTC: 68000,
  ETH: 3500,
  MSTR: 390,
  HOOD: 18,
  BMNR: 6,
  APLD: 8,
};

// Prior close prices (Daily P/L baseline)
export const PRIOR_CLOSE_PRICES = {
  ASML: 700,
  NVDA: 830,
  AVGO: 1180,
  BTC: 67000,
  ETH: 3400,
  MSTR: 380,
  HOOD: 17.5,
  BMNR: 5.8,
  APLD: 7.9,
};

export function computePortfolioTotals(holdings = []) {
  if (!Array.isArray(holdings)) {
    return {
      totalValue: 0,
      portfolioDailyPL: 0,
      portfolioDailyPct: 0,
      rows: [],
    };
  }

  const rows = holdings.map((h) => {
    const price = MOCK_PRICES[h.symbol] ?? 0;
    const priorClose = PRIOR_CLOSE_PRICES[h.symbol] ?? price;
    const quantity = Number(h.quantity || 0);

    const value = price * quantity;
    const dailyPL = (price - priorClose) * quantity;
    const dailyPct =
      priorClose > 0 ? (price - priorClose) / priorClose : 0;

    return {
      ...h,
      price,
      priorClose,
      value,
      dailyPL,
      dailyPct,
    };
  });

  const totalValue = rows.reduce((sum, r) => sum + r.value, 0);
  const portfolioDailyPL = rows.reduce((sum, r) => sum + r.dailyPL, 0);

  const portfolioDailyPct =
    totalValue - portfolioDailyPL > 0
      ? portfolioDailyPL / (totalValue - portfolioDailyPL)
      : 0;

  return {
    totalValue,
    portfolioDailyPL,
    portfolioDailyPct,
    rows,
  };
}

