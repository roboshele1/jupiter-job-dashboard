import { useEffect, useState } from "react";
import { buildInsightsSnapshot } from "../insights/insightsPipeline";

export default function Insights() {
  const [insights, setInsights] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        // Pull authoritative snapshot from Portfolio (single source of truth)
        const portfolioSnapshot = await window.api.getPortfolioValuation();

        // Pass FULL snapshot to pipeline (contract-safe)
        const result = await buildInsightsSnapshot(portfolioSnapshot);

        if (mounted) setInsights(result);
      } catch (err) {
        console.error("[INSIGHTS] load failed:", err);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  if (!insights) {
    return <div style={{ padding: 24 }}>Loading insights…</div>;
  }

  const totalValue =
    insights.snapshot?.totalValue != null
      ? `$${Number(insights.snapshot.totalValue).toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        })}`
      : "—";

  return (
    <div style={{ padding: 24 }}>
      <h2>Insights</h2>

      <section style={{ marginTop: 16 }}>
        <h4>Status</h4>
        <ul>
          <li>Mode: {insights.meta.mode}</li>
          <li>Phase: {insights.meta.phase}</li>
          <li>Status: {insights.meta.status}</li>
        </ul>
      </section>

      <section style={{ marginTop: 16 }}>
        <h4>Snapshot</h4>
        <ul>
          <li>
            Timestamp:{" "}
            {insights.snapshot?.timestamp
              ? new Date(insights.snapshot.timestamp).toLocaleString()
              : "—"}
          </li>
          <li>Total Value: {totalValue}</li>
        </ul>
      </section>
    </div>
  );
}

