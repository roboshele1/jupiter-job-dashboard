import React from "react";

export default function TickerGrid({ tickers }) {
  if (!tickers || tickers.length === 0) return null;

  return (
    <div className="ticker-grid">
      {tickers.map((ticker) => (
        <div key={ticker.symbol} className="ticker-card">
          <div className="ticker-symbol">{ticker.symbol}</div>
          <div className="ticker-price">${ticker.price.toFixed(2)}</div>
          <div
            className="ticker-change"
            style={{ color: ticker.dailyChange >= 0 ? "#4CAF50" : "#F44336" }}
          >
            {ticker.dailyChange >= 0 ? "+" : ""}
            {ticker.dailyChange?.toFixed(2)}%
          </div>
          <div className="ticker-pl">P/L: ${ticker.PL.toFixed(2)}</div>
        </div>
      ))}
    </div>
  );
}

