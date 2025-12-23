// renderer/pages/Chat.jsx
// Phase 3: Read-only Chat with semantic interpretation enrichment

import React from "react";

import { readDashboardTruth } from "../stores/dashboardRead";
import { interpretDashboard } from "../engine/interpretationEngine";
import { enrichInterpretation } from "../chat/interpretationEnrichment";

export default function Chat() {
  // Layer 1: Raw dashboard truth
  const dashboardTruth = readDashboardTruth();

  // Layer 2: Structured interpretation
  const interpretation = interpretDashboard(dashboardTruth);

  // Layer 3: Semantic enrichment
  const enrichment = enrichInterpretation(interpretation);

  return (
    <div style={{ padding: "32px", maxWidth: 960 }}>
      <h1>Chat</h1>
      <p style={{ opacity: 0.7 }}>
        Read-only Dashboard context (Phase 3 · Observer).
      </p>

      {/* Raw Truth */}
      <section style={{ marginTop: 32 }}>
        <h2>Dashboard Truth</h2>
        <pre className="panel">
          {JSON.stringify(dashboardTruth, null, 2)}
        </pre>
      </section>

      {/* Structured Interpretation */}
      <section style={{ marginTop: 32 }}>
        <h2>Dashboard Interpretation</h2>
        <pre className="panel">
          {JSON.stringify(interpretation, null, 2)}
        </pre>
      </section>

      {/* Enriched Interpretation */}
      <section style={{ marginTop: 32 }}>
        <h2>Enriched Interpretation</h2>

        <div className="panel">
          <p><strong>Summary</strong></p>
          <p>{enrichment.summary}</p>

          {enrichment.insights?.length > 0 && (
            <>
              <p><strong>Insights</strong></p>
              <ul>
                {enrichment.insights.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </>
          )}

          {enrichment.riskNotes?.length > 0 && (
            <>
              <p><strong>Risk Notes</strong></p>
              <ul>
                {enrichment.riskNotes.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </>
          )}

          <p style={{ marginTop: 16, opacity: 0.6 }}>
            System mode: {enrichment.system.mode} · Phase {enrichment.system.phase}
          </p>
        </div>
      </section>
    </div>
  );
}

