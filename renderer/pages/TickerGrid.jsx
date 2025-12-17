import React from "react";

export default function TickerGrid({ tickers }) {
  return (
    <div className="ticker-grid">
      {tickers.map((ticker) => (
        <div key={ticker.symbol} className="ticker-card">
          <div className="symbol">{ticker.symbol}</div>
          <div className="price">${ticker.price.toFixed(2)}</div>
          <div
            className="daily-change"
            style={{ color: ticker.change >= 0 ? "#4CAF50" : "#F44336" }}
          >
            {ticker.change >= 0 ? "+" : "-"}
            {Math.abs(ticker.change).toFixed(2)}%
          </div>
          <div
            className="pl"
            style={{ color: ticker.PL >= 0 ? "#4CAF50" : "#F44336" }}
          >
            {ticker.PL >= 0 ? "+" : "-"}${Math.abs(ticker.PL).toFixed(2)}
          </div>
        </div>
      ))}
    </div>
  );
}

