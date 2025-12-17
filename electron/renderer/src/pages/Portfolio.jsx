// ~/JUPITER/electron/renderer/src/pages/Portfolio.jsx

import { useEffect, useState } from "react";
import { fetchLiveQuotes } from "../../services/marketData";

/*
Phase 2B — Step 3 (Portfolio Wiring)
- Holdings ingestion (static seed, no mocks)
- Live pricing per holding
- P&L + allocation
*/

export default function Portfolio() {
  // 🔒 Seed holdings (replace with ingestion later)
  const HOLDINGS = [
    { symbol: "AAPL", shares: 50, costBasis: 190 },
    { symbol: "MSFT", shares: 30, costBasis: 310 },
    { symbol: "NVDA", shares: 20, costBasis: 450 }
  ];

  const [rows, setRows] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const symbols = HOLDINGS.map(h => h.symbol);
        const quotes = await fetchLiveQuotes(symbols);

        const merged = HOLDINGS.map(h => {
          const q = quotes.find(x => x.symbol === h.symbol) || {};
          const price = q.price ?? 0;
          const value = price * h.shares;
          const cost = h.costBasis * h.shares;
          const pnl = value - cost;
          const pnlPct = cost ? (pnl / cost) * 100 : 0;

          return {
            symbol: h.symbol,
            shares: h.shares,
            price,
            value,
            cost,
            pnl,
            pnlPct
          };
        });

        if (mounted) setRows(merged);
      } catch (e) {
        if (mounted) setError(e.message);
      }
    }

    load();
    return () => (mounted = false);
  }, []);

  const totalValue = rows.reduce((s, r) => s + r.value, 0);

  if (error) {
    return <div style={{ padding: 16 }}>Error: {error}</div>;
  }

  return (
    <div style={{ padding: 16 }}>
      <h2>Portfolio</h2>

      <table width="100%" cellPadding="8">
        <thead>
          <tr>
            <th align="left">Symbol</th>
            <th align="right">Shares</th>
            <th align="right">Price</th>
            <th align="right">Value</th>
            <th align="right">P&L</th>
            <th align="right">P&L %</th>
            <th align="right">Allocation</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.symbol}>
              <td>{r.symbol}</td>
              <td align="right">{r.shares}</td>
              <td align="right">{r.price.toFixed(2)}</td>
              <td align="right">{r.value.toFixed(2)}</td>
              <td align="right">{r.pnl.toFixed(2)}</td>
              <td align="right">{r.pnlPct.toFixed(2)}%</td>
              <td align="right">
                {totalValue ? ((r.value / totalValue) * 100).toFixed(2) : 0}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

