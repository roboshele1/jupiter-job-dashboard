import { useEffect, useState } from "react";
import { buildInsightsSnapshot } from "../insights/insightsPipeline.js";

export default function Insights() {
  const [data, setData] = useState(null);

  useEffect(() => {
    async function load() {
      const portfolioSnapshot = await window.jupiter.getPortfolioValuation();
      const insights = await buildInsightsSnapshot(portfolioSnapshot);
      setData(insights);
    }
    load();
  }, []);

  if (!data) return null;

  const snapshot = data.snapshot || {};
  const portfolio = data.portfolio || {};

  const isReady = portfolio.totalValue != null;

  return (
    <div>
      <h1>Insights</h1>

      <h3>Status</h3>
      <ul>
        <li>Mode: {data.meta.mode}</li>
        <li>Phase: {data.meta.phase}</li>
        <li>Status: {isReady ? "ready" : "partial"}</li>
      </ul>

      <h3>Snapshot</h3>
      <ul>
        <li>
          Timestamp:{" "}
          {snapshot.timestamp
            ? new Date(snapshot.timestamp).toLocaleString()
            : "—"}
        </li>
        <li>
          Total Value:{" "}
          {isReady
            ? `$${portfolio.totalValue.toLocaleString()}`
            : "—"}
        </li>
      </ul>
    </div>
  );
}

