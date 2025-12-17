import React, { useEffect, useState } from "react";
import TickerGrid from "../components/TickerGrid";
import { fetchLastQuote } from "../../api/marketDataServiceNew";

export default function Home() {
  const [portfolio, setPortfolio] = useState([
    { symbol: "AAPL", price: 0, dailyChange: 0, PL: 0 },
    { symbol: "MSFT", price: 0, dailyChange: 0, PL: 0 },
    { symbol: "NVDA", price: 0, dailyChange: 0, PL: 0 },
    { symbol: "AMZN", price: 0, dailyChange: 0, PL: 0 },
    { symbol: "TSLA", price: 0, dailyChange: 0, PL: 0 },
    { symbol: "GOOGL", price: 0, dailyChange: 0, PL: 0 },
    { symbol: "META", price: 0, dailyChange: 0, PL: 0 },
    { symbol: "NFLX", price: 0, dailyChange: 0, PL: 0 },
    { symbol: "BABA", price: 0, dailyChange: 0, PL: 0 },
  ]);

  const [totalValue, setTotalValue] = useState(0);
  const [totalPL, setTotalPL] = useState(0);

  useEffect(() => {
    async function updatePortfolio() {
      const updated = await Promise.all(
        portfolio.map(async (t) => {
          const quote = await fetchLastQuote(t.symbol);
          const price = quote.last.price;
          const dailyChange = ((price - t.price) / (t.price || 1)) * 100;
          const PL = price - t.price;
          return { ...t, price, dailyChange, PL };
        })
      );
      setPortfolio(updated);
      setTotalValue(updated.reduce((acc, t) => acc + t.price, 0));
      setTotalPL(
        (updated.reduce((acc, t) => acc + t.PL, 0) /
          updated.reduce((acc, t) => acc + t.price, 1)) *
          100
      );
    }

    updatePortfolio();
  }, []);

  return (
    <div className="home-container">
      <div className="total-portfolio">
        <h1>Total Portfolio Value</h1>
        <div className="total-value">${totalValue.toFixed(2)}</div>
        <div
          className="total-change"
          style={{ color: totalPL >= 0 ? "#4CAF50" : "#F44336" }}
        >
          {totalPL >= 0 ? "+" : "-"}
          {Math.abs(totalPL).toFixed(2)}% P/L Today
        </div>
      </div>
      <TickerGrid tickers={portfolio} />
    </div>
  );
}

