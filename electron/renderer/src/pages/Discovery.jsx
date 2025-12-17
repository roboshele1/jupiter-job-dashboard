// ~/JUPITER/electron/renderer/src/pages/Discovery.jsx

import { useEffect, useState } from "react";
import { fetchLiveQuotes } from "../../services/marketData";

/*
Phase 2B — Step 4 (Discovery Lab)
- Live market scanning
- Simple movers surface (by price level for now)
- No mocks, no placeholders
*/

export default function Discovery() {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState(null);

  // Initial discovery universe (expand later)
  const SYMBOLS = ["AAPL", "MSFT", "NVDA", "TSLA", "AMZN", "META"];

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const data = await fetchLiveQuotes(SYMBOLS);
        // deterministic sort: highest price first (proxy for activity)
        const sorted = [...data].sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
        if (mounted) setRows(sorted);
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
      <h2>Discovery Lab</h2>

      <table width="100%" cellPadding="8">
        <thead>
          <tr>
            <th align="left">Symbol</th>
            <th align="right">Price</th>
            <th align="right">Open</th>
            <th align="right">High</th>
            <th align="right">Low</th>
            <th align="right">Volume</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.symbol}>
              <td>{r.symbol}</td>
              <td align="right">{r.price ?? "-"}</td>
              <td align="right">{r.open ?? "-"}</td>
              <td align="right">{r.high ?? "-"}</td>
              <td align="right">{r.low ?? "-"}</td>
              <td align="right">{r.volume ?? "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

