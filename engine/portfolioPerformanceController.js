export async function getPortfolioPerformance({ polygonApiKey } = {}) {
  if (!polygonApiKey) {
    throw new Error("Polygon API key not provided to engine");
  }

  // ---- TEMP MOCK DATA (engine validation layer) ----
  const rows = [
    { symbol: "AAPL", quantity: 10, price: 195.2, pnl: 142.3 },
    { symbol: "NVDA", quantity: 5, price: 488.6, pnl: 321.1 },
  ];

  const totals = {
    marketValue: rows.reduce((s, r) => s + r.price * r.quantity, 0),
    pnl: rows.reduce((s, r) => s + r.pnl, 0),
  };

  return { totals, rows };
}

