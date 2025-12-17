// ~/JUPITER/electron/renderer/src/pages/Risk.jsx

import { useEffect, useState } from "react";
import { fetchLiveQuotes } from "../../services/marketData";

/*
Phase 2B — Step 7 (Risk Centre)
- Exposure analysis
- Concentration risk
- Simple drawdown proxy
- Live market data only
*/

export default function Risk() {
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState(null);

  // Same holdings universe as Portfolio for coherence
  const HOLDINGS = [
    { symbol: "AAPL", shares: 50 },
    { symbol: "MSFT", shares: 30 },
    { symbol: "NVDA", shares: 20 }
  ];

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const symbols = HOLDINGS.map(h => h.symbol);
        const quotes = await fetchLiveQuotes(symbols);

        const enriched = HOLDINGS.map(h => {
          const q = quotes.find(x => x.symbol === h.symbol) || {};
          const price = q.price ?? 0;
          const value = price * h.shares;

          return {
            symbol: h.symbol,
            shares: h.shares,
            price,
            value
          };
        });

        const totalValue = enriched.reduce((s, r) => s + r.value, 0);

        const withRisk = enriched.map(r => ({
          ...r,
          allocationPct: totalValue ? (r.value / totalValue) * 100 : 0
        }));

        const maxAllocation = Math.max(
          ...withRisk.map(r => r.allocationPct)
        );

        const riskSummary = {
          totalValue,
          maxAllocation,
          concentrationFlag: maxAllocation > 45
        };

        if (mounted) {
          setRows(withRisk);
          setSummary(riskSummary);
        }
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
      <h2>Risk Centre</h2>

      {summary && (
        <div style={{ marginBottom: 16 }}>
          <div>Total Portfolio Value: {summary.totalValue.toFixed(2)}</div>
          <div>
            Largest Position Allocation:{" "}
            {summary.maxAllocation.toFixed(2)}%
          </div>
          {summary.concentrationFlag && (
            <div style={{ color: "orange" }}>
              ⚠️ Concentration risk detected (single position &gt; 45%)
            </div>
          )}
        </div>
      )}

      <table width="100%" cellPadding="8">
        <thead>
          <tr>
            <th align="left">Symbol</th>
            <th align="right">Shares</th>
            <th align="right">Price</th>
            <th align="right">Value</th>
            <th align="right">Allocation %</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.symbol}>
              <td>{r.symbol}</td>
              <td align="right">{r.shares}</td>
              <td align="right">{r.price.toFixed(2)}</td>
              <td align="right">{r.value.toFixed(2)}</td>
              <td align="right">{r.allocationPct.toFixed(2)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

