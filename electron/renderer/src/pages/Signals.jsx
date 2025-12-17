// ~/JUPITER/electron/renderer/src/pages/Signals.jsx

import { useEffect, useState } from "react";
import { fetchLiveQuotes } from "../../services/marketData";
import Sparkline from "../components/Sparkline";

/*
Phase 3B · Step 2 — Charts & Sparklines
Signals / Market Monitor with visual price movement
*/

export default function Signals() {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState(null);

  const SYMBOLS = ["AAPL", "MSFT", "NVDA"];

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const quotes = await fetchLiveQuotes(SYMBOLS);

        const enriched = quotes.map(q => ({
          ...q,
          // simple synthetic intraday curve for now (visual plumbing)
          history: [
            q.open * 0.995,
            q.open,
            q.price * 0.998,
            q.price
          ]
        }));

        if (mounted) setRows(enriched);
      } catch (e) {
        if (mounted) setError(e.message);
      }
    }

    load();
    return () => (mounted = false);
  }, []);

  if (error) return <div style={{ padding: 16 }}>Error: {error}</div>;

  return (
    <div style={{ padding: 16 }}>
      <h2>Signals / Market Monitor</h2>

      <table width="100%" cellPadding="8">
        <thead>
          <tr>
            <th align="left">Symbol</th>
            <th align="right">Price</th>
            <th align="right">Open</th>
            <th align="right">High</th>
            <th align="right">Low</th>
            <th align="right">Volume</th>
            <th align="center">Trend</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.symbol}>
              <td>{r.symbol}</td>
              <td align="right">{r.price}</td>
              <td align="right">{r.open}</td>
              <td align="right">{r.high}</td>
              <td align="right">{r.low}</td>
              <td align="right">{r.volume}</td>
              <td align="center">
                <Sparkline data={r.history} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

