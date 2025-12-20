// renderer/pages/Home.jsx

import React from "react";
import { computePortfolioTotals } from "../services/portfolioEngine";

export default function Home({ holdings }) {
  const totals = computePortfolioTotals(holdings);

  return (
    <div>
      <h1>Dashboard</h1>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
        <div>
          <h3>Total Portfolio Value</h3>
          <div>${totals.totalValue.toFixed(2)}</div>
        </div>

        <div>
          <h3>Daily P/L</h3>
          <div
            style={{ color: totals.totalPL >= 0 ? "#4CAF50" : "#F44336" }}
          >
            {totals.totalPL >= 0 ? "+" : "-"}$
            {Math.abs(totals.totalPL).toFixed(2)}
          </div>
        </div>

        <div>
          <h3>P/L %</h3>
          <div>{totals.totalPLPct.toFixed(2)}%</div>
        </div>
      </div>
    </div>
  );
}

