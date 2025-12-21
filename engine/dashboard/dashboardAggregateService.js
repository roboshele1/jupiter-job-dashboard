// engine/dashboard/dashboardAggregateService.js
// JUPITER — Dashboard Aggregate Engine (AUTHORITATIVE)

export function calculateDashboardAggregate(snapshot) {
  const totals = snapshot?.totals || {};

  // Totals (authoritative)
  const totalValueRaw = totals.value ?? totals.totalValue ?? snapshot?.totalValue ?? 0;
  const pnlRaw = totals.pnl ?? snapshot?.pnl ?? 0;
  const costRaw = totals.cost ?? totals.totalCost ?? snapshot?.totalCost ?? 0;

  const totalValue = toNumber(totalValueRaw, 0);
  const pnl = toNumber(pnlRaw, 0);
  const cost = toNumber(costRaw, 0);

  const pnlPct = cost > 0 ? pnl / cost : 0;

  // Positions
  const positions = Array.isArray(snapshot?.positions) ? snapshot.positions : [];

  // Allocation (simple, deterministic: BTC/ETH = Digital Assets, else Equities)
  let equitiesValue = 0;
  let digitalValue = 0;

  for (const p of positions) {
    const symbol = String(p?.symbol || "").toUpperCase();
    const qty = toNumber(p?.quantity ?? p?.qty, 0);
    const price = toNumber(p?.price, 0);
    const value = toNumber(p?.value, qty * price);

    if (symbol === "BTC" || symbol === "ETH") digitalValue += value;
    else equitiesValue += value;
  }

  const denom = totalValue > 0 ? totalValue : (equitiesValue + digitalValue);

  const allocation = {
    equitiesPct: denom > 0 ? equitiesValue / denom : 0,
    digitalAssetsPct: denom > 0 ? digitalValue / denom : 0,
  };

  // Top holdings (by value desc)
  const topHoldings = positions
    .map((p) => {
      const symbol = String(p?.symbol || "").toUpperCase();
      const quantity = toNumber(p?.quantity ?? p?.qty, 0);
      const price = toNumber(p?.price, 0);
      const value = toNumber(p?.value, quantity * price);
      return { symbol, quantity, value };
    })
    .sort((a, b) => b.value - a.value)
    .slice(0, 5)
    .map(({ symbol, quantity }) => ({ symbol, quantity }));

  return {
    timestamp: snapshot?.timestamp || new Date().toISOString(),
    totalValue,
    pnl,
    pnlPct,
    allocation,
    topHoldings,
  };
}

function toNumber(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

