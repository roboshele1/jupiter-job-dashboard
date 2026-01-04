// renderer/pages/Chat.jsx
// -----------------------
// Phase 17 — Full insights rendering + Decision Engine read-only integration

import React, { useState } from "react";
import { buildChatInsight } from "../chat/chatPipeline.js";
import { usePortfolioSnapshotStore } from "../state/portfolioSnapshotStore.js";

const FALLBACK_SNAPSHOT = {
  allocation: {
    top: [
      { symbol: "NVDA" },
      { symbol: "ASML" },
      { symbol: "AVGO" },
      { symbol: "MSTR" },
      { symbol: "HOOD" },
      { symbol: "BMNR" },
      { symbol: "APLD" },
      { symbol: "BTC" },
      { symbol: "ETH" },
    ],
  },
  synthesis: {
    dominantRiskDriver: null,
    growthAlignment: null,
  },
};

export default function Chat() {
  const snapshot = usePortfolioSnapshotStore();
  const activeSnapshot =
    snapshot?.allocation?.top?.length > 0 ? snapshot : FALLBACK_SNAPSHOT;

  const insight = buildChatInsight({
    portfolioSummary: {
      concentration: activeSnapshot.allocation.top.map((p) => p.symbol).join(" & ") || "N/A",
    },
    allocation: activeSnapshot.allocation,
    riskSummary: {
      primaryDriver: activeSnapshot.synthesis.dominantRiskDriver,
    },
    growthSummary: {
      alignment: activeSnapshot.synthesis.growthAlignment,
    },
  });

  // =========================================================
  // APPENDED: DECISION ENGINE READ-ONLY VISUALIZATION
  // =========================================================

  const [decision, setDecision] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleDecisionQuery() {
    setLoading(true);
    try {
      const result = await window.api.invoke("decision:run", { query: "current regime" });
      setDecision(result);
    } catch (err) {
      console.error("Decision Engine error:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: "1rem" }}>
      <h1>Chat</h1>
      <div
        style={{
          border: "1px solid #555",
          padding: "1rem",
          borderRadius: "0.5rem",
          backgroundColor: "#111",
          color: "#fff",
          marginBottom: "1rem",
        }}
      >
        <h2>{insight.headline}</h2>
        <p>{insight.context}</p>
      </div>

      {insight.holdings.map((h) => (
        <div
          key={h.symbol}
          style={{
            border: "1px solid #333",
            padding: "0.75rem",
            borderRadius: "0.5rem",
            backgroundColor: "#222",
            color: "#fff",
            marginBottom: "0.5rem",
          }}
        >
          <strong>{h.symbol}</strong>
          <p>{h.note}</p>
        </div>
      ))}

      <small style={{ opacity: 0.7 }}>{insight.footer}</small>

      {/* APPENDED: Decision Engine Output */}
      <div style={{ marginTop: "2rem", padding: "1rem", border: "1px solid #444", borderRadius: "0.5rem" }}>
        <button onClick={handleDecisionQuery} disabled={loading}>
          {loading ? "Loading…" : "Run Decision Engine"}
        </button>
        {decision && (
          <div style={{ marginTop: "1rem" }}>
            <h3>Decision Summary</h3>
            <p>
              Regime: <strong>{decision.assessment?.regime}</strong> (
              {Math.round(decision.assessment?.confidence * 100)}%)
            </p>
            <p>Posture: <strong>{decision.assessment?.posture}</strong></p>
          </div>
        )}
      </div>
    </div>
  );
}
