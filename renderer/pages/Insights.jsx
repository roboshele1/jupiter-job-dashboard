import { useEffect, useState } from "react";
import { buildInsightsSnapshotFromSnapshot } from "../insights/insightsPipeline";
import { renderInsightsBlock } from "../insights/insightsRendererMap.jsx";

export default function Insights() {
  const [insights, setInsights] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const portfolioSnapshot =
          await window.api.getPortfolioValuation();

        const built =
          await buildInsightsSnapshotFromSnapshot(portfolioSnapshot);

        if (mounted) setInsights(built);
      } catch (err) {
        console.error("[INSIGHTS] load failed:", err);
        if (mounted) setError(err.message);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  if (error) {
    return <div style={{ padding: 24 }}>Insights error: {error}</div>;
  }

  if (!insights) {
    return <div style={{ padding: 24 }}>Loading insights…</div>;
  }

  return (
    <div style={{ padding: 24 }}>
      <h2>Insights</h2>
      {renderInsightsBlock(insights)}
    </div>
  );
}

