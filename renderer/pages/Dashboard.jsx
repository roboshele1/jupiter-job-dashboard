import React from "react";
import holdings from "../data/holdings";

export default function Dashboard() {
  const safe = (v) => (typeof v === "number" && !isNaN(v) ? v.toFixed(2) : "--");

  const totalValue = holdings.reduce(
    (sum, h) => sum + (typeof h.value === "number" ? h.value : 0),
    0
  );

  const totalPL = holdings.reduce(
    (sum, h) => sum + (typeof h.dailyPL === "number" ? h.dailyPL : 0),
    0
  );

  return (
    <div>
      <h1>Dashboard</h1>

      <h2>Total Portfolio Value</h2>
      <p>${safe(totalValue)}</p>

      <h2>Daily P/L</h2>
      <p
        style={{
          color: totalPL >= 0 ? "#4ade80" : "#f87171",
          fontWeight: "bold"
        }}
      >
        ${safe(totalPL)} (0.00%)
      </p>

      <h2>Asset Allocation</h2>
      <ul>
        <li>Equities — 0.00%</li>
        <li>Digital Assets — 0.00%</li>
      </ul>

      <h2>Top Holdings</h2>
      <ul>
        {holdings.slice(0, 5).map((h) => (
          <li key={h.symbol}>
            {h.symbol} — {h.quantity}
          </li>
        ))}
      </ul>
    </div>
  );
}

