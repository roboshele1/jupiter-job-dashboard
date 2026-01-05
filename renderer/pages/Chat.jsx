// renderer/pages/Chat.jsx
// -----------------------
// Phase 30 — Chat V2 IPC-aligned UI
// Read-only, governed, deterministic
// Legacy insight + decision flows preserved

import React, { useState } from "react";
import { buildChatInsight } from "../chat/chatPipeline.js";
import { usePortfolioSnapshotStore } from "../state/portfolioSnapshotStore.js";

/* =========================================================
   FALLBACK SNAPSHOT (SAFE)
   ========================================================= */

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
      { symbol: "ETH" }
    ]
  },
  synthesis: {
    dominantRiskDriver: null,
    growthAlignment: null
  }
};

export default function Chat() {
  const snapshot = usePortfolioSnapshotStore();
  const activeSnapshot =
    snapshot?.allocation?.top?.length > 0 ? snapshot : FALLBACK_SNAPSHOT;

  /* =========================================================
     LEGACY INSIGHT PIPELINE (UNCHANGED)
     ========================================================= */

  const insight = buildChatInsight({
    portfolioSummary: {
      concentration:
        activeSnapshot.allocation.top.map((p) => p.symbol).join(" & ") || "N/A"
    },
    allocation: activeSnapshot.allocation,
    riskSummary: {
      primaryDriver: activeSnapshot.synthesis.dominantRiskDriver
    },
    growthSummary: {
      alignment: activeSnapshot.synthesis.growthAlignment
    }
  });

  /* =========================================================
     DECISION ENGINE (UNCHANGED)
     ========================================================= */

  const [decision, setDecision] = useState(null);
  const [decisionLoading, setDecisionLoading] = useState(false);

  async function handleDecisionQuery() {
    setDecisionLoading(true);
    try {
      const result = await window.api.invoke("decision:run", {
        query: "current regime"
      });
      setDecision(result);
    } catch (err) {
      console.error("Decision Engine error:", err);
    } finally {
      setDecisionLoading(false);
    }
  }

  /* =========================================================
     CHAT V2 — AUTHORITATIVE IPC (PHASE 30)
     ========================================================= */

  const [query, setQuery] = useState("");
  const [chatResult, setChatResult] = useState(null);
  const [chatLoading, setChatLoading] = useState(false);

  async function handleChatSubmit() {
    if (!query.trim()) {
      setChatResult({
        contract: "CHAT_V2_CONTROL_LAYER",
        status: "READY",
        response: {
          headline: "No valid question was provided.",
          bullets: ["No valid question was provided."],
          sections: {}
        }
      });
      return;
    }

    setChatLoading(true);
    setChatResult(null);

    try {
      const result = await window.api.invoke("chat:v2:run", {
        query,
        userPreferences: {},
        memoryContext: null,
        context: null
      });

      setChatResult(result);
    } catch (err) {
      console.error("Chat V2 error:", err);
      setChatResult({
        contract: "CHAT_V2_ERROR",
        status: "ERROR",
        response: {
          headline: "Chat intelligence failed.",
          bullets: ["An internal IPC error occurred."],
          sections: {}
        }
      });
    } finally {
      setChatLoading(false);
    }
  }

  return (
    <div style={{ padding: "1rem" }}>
      <h1>Chat</h1>

      {/* =====================================================
         INSIGHT SUMMARY (V1)
         ===================================================== */}

      <div
        style={{
          border: "1px solid #555",
          padding: "1rem",
          borderRadius: "0.5rem",
          backgroundColor: "#111",
          color: "#fff",
          marginBottom: "1rem"
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
            marginBottom: "0.5rem"
          }}
        >
          <strong>{h.symbol}</strong>
          <p>{h.note}</p>
        </div>
      ))}

      <small style={{ opacity: 0.7 }}>{insight.footer}</small>

      {/* =====================================================
         DECISION ENGINE
         ===================================================== */}

      <div
        style={{
          marginTop: "2rem",
          padding: "1rem",
          border: "1px solid #444",
          borderRadius: "0.5rem"
        }}
      >
        <button onClick={handleDecisionQuery} disabled={decisionLoading}>
          {decisionLoading ? "Loading…" : "Run Decision Engine"}
        </button>

        {decision && (
          <div style={{ marginTop: "1rem" }}>
            <h3>Decision Summary</h3>
            <p>
              Regime: <strong>{decision.assessment?.regime}</strong> (
              {Math.round(decision.assessment?.confidence * 100)}%)
            </p>
            <p>
              Posture: <strong>{decision.assessment?.posture}</strong>
            </p>
          </div>
        )}
      </div>

      {/* =====================================================
         CHAT V2 UI
         ===================================================== */}

      <div
        style={{
          marginTop: "2rem",
          padding: "1rem",
          border: "1px solid #555",
          borderRadius: "0.5rem",
          backgroundColor: "#0d0d0d"
        }}
      >
        <h3>Ask Jupiter</h3>

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask a portfolio or market question…"
          style={{
            width: "100%",
            padding: "0.5rem",
            marginBottom: "0.5rem"
          }}
        />

        <button onClick={handleChatSubmit} disabled={chatLoading}>
          {chatLoading ? "Thinking…" : "Run Intelligence"}
        </button>

        {chatResult && (
          <div style={{ marginTop: "1rem" }}>
            <h4>{chatResult.response?.headline}</h4>

            {chatResult.response?.bullets?.map((b, i) => (
              <p key={i}>• {b}</p>
            ))}

            <small style={{ opacity: 0.6 }}>
              Contract: {chatResult.contract} · Status: {chatResult.status}
            </small>
          </div>
        )}
      </div>
    </div>
  );
}
