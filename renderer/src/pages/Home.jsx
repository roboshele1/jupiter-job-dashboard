import React, { useEffect, useState } from 'react';
import '../styles/home.css';
import { fetchPortfolioData } from '../services/marketData';

export default function Home() {
  const [portfolio, setPortfolio] = useState([]);
  const [totalValue, setTotalValue] = useState(0);
  const [totalPL, setTotalPL] = useState(0);

  useEffect(() => {
    async function loadData() {
      const data = await fetchPortfolioData();
      setPortfolio(data.tickers);
      setTotalValue(data.totalValue);
      setTotalPL(data.totalPL);
    }
    loadData();
  }, []);

  return (
    <div className="home-container">
      <div className="total-portfolio">
        <h1>Total Portfolio Value</h1>
        <div className="total-value">${totalValue.toFixed(2)}</div>
        <div className="total-change" style={{ color: totalPL >= 0 ? "#4CAF50" : "#F44336" }}>
          {totalPL >= 0 ? "+" : "-"}{Math.abs(totalPL).toFixed(2)}% P/L Today
        </div>
      </div>

      <div className="ticker-grid">
        {portfolio.map(ticker => (
          <div key={ticker.symbol} className="ticker-card">
            <div className="symbol">{ticker.symbol}</div>
            <div className="price">${ticker.price.toFixed(2)}</div>
            <div className="change" style={{ color: ticker.PL >= 0 ? "#4CAF50" : "#F44336" }}>
              {ticker.PL >= 0 ? "+" : "-"}{Math.abs(ticker.PL).toFixed(2)}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

