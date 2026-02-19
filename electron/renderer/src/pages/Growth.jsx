// ~/JUPITER/electron/renderer/src/pages/Growth.jsx

import { useEffect, useState } from "react";
import { fetchLiveQuotes } from "../services/marketData";

/*
Phase 2B — Step 5 (Growth Engine Activation)
- Scenario modeling (deterministic, simple CAGR projection)
- Uses live market prices only
- No mocks, no placeholders
*/

export default function Growth() {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState(null);

  // Seed universe for projections (can be expanded later)
  const UNIVERSE = [
    { symbol: "AAPL", baseCagr: 0.08 },
    { symbol: "MSFT", baseCagr: 0.09 },
    { symbol: "NVDA", baseCagr: 0.12 }
  ];

  // Projection horizon (years)
  const YEARS = 5;

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const symbols = UNIVERSE.map(u => u.symbol);
        const quotes = await fetchLiveQuotes(symbols);

        const projections = UNIVERSE.map(u => {
          const q = quotes.find(x => x.symbol === u.symbol) || {};
          const price = q.price ?? 0;

          const futureValue =
            price * Math.pow(1 + u.baseCagr, YEARS);

          const totalReturn =
            price > 0 ? ((futureValue - price) / price) * 100 : 0;

          return {
            symbol: u.symbol,
            price,
            cagr: u.baseCagr * 100,
            years: YEARS,
            projectedPrice: futureValue,
            totalReturnPct: totalReturn
          };
        });

        if (mounted) setRows(projections);
      } catch (e) {
        if (mounted) setError(e.message);
      }
    }

    load();
    return () => (mounted = false);
  }, []);

  if (error) {
    return <div style={{ padding: 16 }}>Error: {error}</div>;
  }

  return (
    <div style={{ padding: 16 }}>
      <h2>Growth Engine</h2>

      <table width="100%" cellPadding="8">
        <thead>
          <tr>
            <th align="left">Symbol</th>
            <th align="right">Current Price</th>
            <th align="right">Assumed CAGR</th>
            <th align="right">Horizon (yrs)</th>
            <th align="right">Projected Price</th>
            <th align="right">Total Return %</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.symbol}>
              <td>{r.symbol}</td>
              <td align="right">{r.price.toFixed(2)}</td>
              <td align="right">{r.cagr.toFixed(2)}%</td>
              <td align="right">{r.years}</td>
              <td align="right">{r.projectedPrice.toFixed(2)}</td>
              <td align="right">{r.totalReturnPct.toFixed(2)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

