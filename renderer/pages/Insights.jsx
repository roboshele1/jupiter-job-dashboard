// renderer/pages/Insights.jsx
// Phase 4 — Read-only Insights Tab
// Institutional research surface (no interaction)

import React from "react";

import { readDashboardTruth } from "../stores/dashboardRead";
import { interpretDashboard } from "../engine/interpretationEngine";
import { generateInsights } from "../insights/insightsEngine";

export default function Insights() {
  // Pipeline: Truth → Interpretation → Insights
  const dashboardTruth = readDashboardTruth();
  const interpretation = interpretDashboard(dashboardTruth);
  const insights = generateInsights(interpretation);

  return (
    <div style={{ padding: 32, maxWidth: 1000 }}>
      <h1>Insights</h1>
      <p style={{ opacity: 0.7 }}>
        Read-only institutional insights (Phase 4).
      </p>

      {/* Snapshot Status */}
      <section style={{ marginTop: 32 }}>
        <h2>Snapshot Status</h2>
        <div className="panel">
          <p>
            <strong>Available:</strong>{" "}
            {insights.snapshot.available ? "Yes" : "No"}
          </p>
          <p>
            <strong>Timestamp:</strong>{" "}
            {insights.snapshot.timestamp ?? "Unavailable"}
          </p>
        </div>
      </section>

      {/* Portfolio Overview */}
      <section style={{ marginTop: 32 }}>
        <h2>Portfolio Overview</h2>
        <div className="panel">
          <p>
            <strong>Total Value:</strong>{" "}
            {insights.portfolio.totalValue != null
              ? `$${insights.portfolio.totalValue.toLocaleString()}`
              : "Unavailable"}
          </p>

          <p>
            <strong>Allocation Summary:</strong>{" "}
            {insights.portfolio.allocationSummary
              ? JSON.stringify(insights.portfolio.allocationSummary)
              : "Unavailable"}
          </p>

          {insights.portfolio.concentrationNote && (
            <p>
              <strong>Concentration:</strong>{" "}
              {insights.portfolio.concentrationNote}
            </p>
          )}
        </div>
      </section>

      {/* Signal Availability */}
      <section style={{ marginTop: 32 }}>
        <h2>Signal Availability</h2>
        <div className="panel">
          <p>
            <strong>Available Signals:</strong>{" "}
            {insights.signals.available.length > 0
              ? insights.signals.available.join(", ")
              : "None"}
          </p>

          <p>
            <strong>Missing Signals:</strong>{" "}
            {insights.signals.missing.length > 0
              ? insights.signals.missing.join(", ")
              : "None"}
          </p>

          {insights.signals.notes.map((note, idx) => (
            <p key={idx} style={{ opacity: 0.7 }}>
              {note}
            </p>
          ))}
        </div>
      </section>

      {/* Risk Observations */}
      <section style={{ marginTop: 32 }}>
        <h2>Risk Observations</h2>
        <div className="panel">
          {insights.risks.observations.length > 0 ? (
            <ul>
              {insights.risks.observations.map((risk, idx) => (
                <li key={idx}>{risk}</li>
              ))}
            </ul>
          ) : (
            <p>No structural risks detected.</p>
          )}

          {insights.risks.dataLimitations.length > 0 && (
            <>
              <h3 style={{ marginTop: 16 }}>Data Limitations</h3>
              <ul>
                {insights.risks.dataLimitations.map((lim, idx) => (
                  <li key={idx}>{lim}</li>
                ))}
              </ul>
            </>
          )}
        </div>
      </section>

      {/* System Footer */}
      <section style={{ marginTop: 40, opacity: 0.6 }}>
        System mode: {insights.system.mode} · Phase {insights.system.phase}
      </section>
    </div>
  );
}

