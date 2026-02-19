// ~/JUPITER/electron/renderer/src/pages/Insights.jsx

import { useEffect, useState } from "react";
import { fetchLiveQuotes } from "../services/marketData";

/*
Phase 3A — Intelligence Depth
Insights (Frontend Synthesis View)

- Consumes live prices
- Applies deterministic synthesis rules
- Displays ranked, actionable insights
*/

export default function Insights() {
  const [insights, setInsights] = useState([]);
  const [error, setError] = useState(null);

  const UNIVERSE = ["AAPL", "MSFT", "NVDA"];

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const quotes = await fetchLiveQuotes(UNIVERSE);

        const generated = [];

        quotes.forEach(q => {
          if (!q.price || !q.open) return;

          const move = ((q.price - q.open) / q.open) * 100;

          if (move > 2) {
            generated.push({
              category: "Signal",
              severity: 2,
              message: `${q.symbol} is exhibiting upside momentum (+${move.toFixed(
                2
              )}%).`
            });
          }

          if (move < -2) {
            generated.push({
              category: "Signal",
              severity: 3,
              message: `${q.symbol} is under selling pressure (${move.toFixed(
                2
              )}%).`
            });
          }
        });

        if (generated.length === 0) {
          generated.push({
            category: "System",
            severity: 0,
            message:
              "No dominant signals detected across monitored assets."
          });
        }

        if (mounted) setInsights(generated);
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
      <h2>Insights</h2>

      <ul>
        {insights.map((i, idx) => (
          <li key={idx} style={{ marginBottom: 12 }}>
            <strong>[{i.category}]</strong> {i.message}
          </li>
        ))}
      </ul>
    </div>
  );
}

