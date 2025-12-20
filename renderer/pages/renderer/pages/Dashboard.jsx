import React from "react";
import { computePortfolioTotals } from "../engine/portfolioEngine";
import holdings from "../data/holdings";

export default function Dashboard() {
  const {
    totalValue,
    portfolioDailyPL,
    portfolioDailyPct,
    rows,
  } = computePortfolioTotals(holdings);

  // ---------- Allocation ----------
  const equitiesValue = rows
    .filter(r => r.assetType === "Equity")
    .reduce((s, r) => s + r.value, 0);

  const digitalValue = rows
    .filter(r => r.assetType === "Digital")
    .reduce((s, r) => s + r.value, 0);

  const equitiesPct =
    totalValue > 0 ? (equitiesValue / totalValue) * 100 : 0;
  const digitalPct =
    totalValue > 0 ? (digitalValue / totalValue) * 100 : 0;

  // ---------- Daily Trend (UI ONLY) ----------
  const isUp = portfolioDailyPct > 0;
  const isDown = portfolioDailyPct < 0;

  const trendArrow = isUp ? "▲" : isDown ? "▼" : "■";
  const trendColor = isUp
    ? "#4ade80"
    : isDown
    ? "#f87171"
    : "#9ca3af";

  const trendBg = isUp
    ? "rgba(74,222,128,0.12)"
    : isDown
    ? "rgba(248,113,113,0.12)"
    : "rgba(156,163,175,0.12)";

  const dailyPctDisplay = Number.isFinite(portfolioDailyPct)
    ? (portfolioDailyPct * 100).toFixed(2)
    : "0.00";

  return (
    <div style={{ padding: "40px", color: "#e5e7eb" }}>
      <h1>Dashboard</h1>

      <h2>Total Portfolio Value</h2>
      <p>${totalValue.toLocaleString()}</p>

      <h2>Daily P/L</h2>
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "10px",
          padding: "10px 14px",
          borderRadius: "10px",
          background: trendBg,
          color: trendColor,
          fontWeight: 600,
          fontSize: "18px",
        }}
      >
        <span style={{ fontSize: "20px" }}>{trendArrow}</span>
        <span>
          {portfolioDailyPL >= 0 ? "+" : "-"}$
          {Math.abs(portfolioDailyPL).toFixed(2)} ({dailyPctDisplay}%)
        </span>
      </div>

      <h2 style={{ marginTop: "30px" }}>Asset Allocation</h2>
      <ul>
        <li>Equities — {equitiesPct.toFixed(2)}%</li>
        <li>Digital Assets — {digitalPct.toFixed(2)}%</li>
      </ul>

      <h2 style={{ marginTop: "30px" }}>Top Holdings</h2>
      <ul>
        {rows.slice(0, 5).map(r => (
          <li key={r.symbol}>
            {r.symbol} — {r.quantity}
          </li>
        ))}
      </ul>
    </div>
  );
}

