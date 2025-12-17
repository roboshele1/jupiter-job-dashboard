import React from "react";

export default function PortfolioSummary({ totalValue, totalPL }) {
  return (
    <div className="portfolio-summary">
      <h1>Total Portfolio Value</h1>
      <div className="total-value">${totalValue.toFixed(2)}</div>
      <div
        className="total-change"
        style={{ color: totalPL >= 0 ? "#4CAF50" : "#F44336" }}
      >
        {totalPL >= 0 ? "+" : "-"}{Math.abs(totalPL).toFixed(2)}% P/L Today
      </div>
    </div>
  );
}

