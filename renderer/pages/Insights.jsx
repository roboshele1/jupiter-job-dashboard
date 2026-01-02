import { useEffect, useState } from "react";
import { buildInsightsSnapshot } from "../insights/insightsPipeline";
import { mapInsightsForRender } from "../insights/insightsRendererMap";

export default function Insights() {
  const [view, setView] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const portfolio = await window.api.getPortfolioValuation();
        const insights = await buildInsightsSnapshot(portfolio);

        const mapped = mapInsightsForRender(insights);
        if (mounted) setView(mapped);
      } catch (err) {
        console.error("[INSIGHTS] load failed:", err);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  if (!view) {
    return <div style={{ padding: 24 }}>Loading insights…</div>;
  }

  const totalValue =
    view.totalValue != null
      ? `$${Number(view.totalValue).toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        })}`
      : "—";

  const dailyPL =
    view.dailyPL != null
      ? `${view.dailyPL >= 0 ? "+" : ""}$${Math.abs(view.dailyPL).toLocaleString()}`
      : "—";

  const dailyPLColor =
    view.dailyPL > 0 ? "#2ecc71" : view.dailyPL < 0 ? "#e74c3c" : "#999";

  return (
    <div style={{ padding: 24 }}>
      <h1>Insights</h1>

      <h3>Status</h3>
      <ul>
        <li>Status: {view.status}</li>
        <li>Generated: {new Date(view.generatedAt).toLocaleString()}</li>
      </ul>

      <h3>Snapshot</h3>
      <ul>
        <li>Total Value: {totalValue}</li>
      </ul>

      {view.signalsAvailable && (
        <>
          <h3>Signals</h3>

          <ul>
            <li>
              Largest Holding:{" "}
              {view.largestHolding ?? "—"}
            </li>

            <li>
              Concentration:{" "}
              {view.concentrationPct != null
                ? `${view.concentrationPct.toFixed(2)}%`
                : "—"}
            </li>

            <li style={{ color: dailyPLColor }}>
              Daily P/L: {dailyPL}
            </li>
          </ul>
        </>
      )}
    </div>
  );
}

