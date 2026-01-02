import React from "react";
import { buildInsightsSnapshot } from "../insights/insightsPipeline";

export default function Insights() {
  const insights = buildInsightsSnapshot();

  return (
    <div style={{ padding: "24px", maxWidth: "900px" }}>
      <h1>Insights</h1>
      <p style={{ opacity: 0.7 }}>
        Observer mode · Read-only · Deterministic
      </p>

      <section>
        <h3>Status</h3>
        <ul>
          <li><strong>Mode:</strong> {insights.meta.mode}</li>
          <li><strong>Phase:</strong> {insights.meta.phase}</li>
          <li><strong>Status:</strong> {insights.meta.status}</li>
        </ul>
      </section>

      <section>
        <h3>Snapshot</h3>
        {insights.meta.status === "ok" ? (
          <ul>
            <li>Portfolio Value available</li>
            <li>Daily P/L available</li>
            <li>Allocation available</li>
          </ul>
        ) : (
          <p style={{ opacity: 0.7 }}>
            Snapshot incomplete or unavailable.
          </p>
        )}
      </section>

      <section>
        <h3>Limitations</h3>
        <ul>
          {insights.limits.map((l, i) => (
            <li key={i}>{l}</li>
          ))}
        </ul>
      </section>

      <section>
        <h3>Warnings</h3>
        <ul>
          {insights.warnings.map((w, i) => (
            <li key={i}>{w}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}

