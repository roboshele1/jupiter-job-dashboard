// renderer/engine/portfolioEngine.js

// ===============================
// V1 DETERMINISTIC PORTFOLIO ENGINE
// ===============================

// Mock current prices (USD)
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

// Mock prior close prices (USD)
// Used ONLY for Daily P/L computation
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
      rows: [],
    };
  }

  const rows = holdings.map((h) => {
    const price = MOCK_PRICES[h.symbol] ?? 0;
    const priorClose = PRIOR_CLOSE_PRICES[h.symbol] ?? price;
    const quantity = Number(h.quantity || 0);

    const value = price * quantity;
    const dailyPL = (price - priorClose) * quantity;

    return {
      ...h,
      price,
      priorClose,
      value,
      dailyPL,
    };
  });

  const totalValue = rows.reduce((sum, r) => sum + r.value, 0);
  const portfolioDailyPL = rows.reduce((sum, r) => sum + r.dailyPL, 0);

  return {
    totalValue,
    portfolioDailyPL,
    rows,
  };
}

