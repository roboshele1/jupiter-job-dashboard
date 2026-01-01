import React from "react";
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

  const topHoldings = activeSnapshot.allocation.top ?? [];
  const dominantRiskDriver = activeSnapshot.synthesis.dominantRiskDriver ?? null;
  const growthAlignment = activeSnapshot.synthesis.growthAlignment ?? null;

  const insight = buildChatInsight({
    portfolioSummary: {
      concentration: topHoldings.map((p) => p.symbol).join(" & ") || "N/A",
    },
    riskSummary: {
      primaryDriver: dominantRiskDriver,
    },
    growthSummary: {
      alignment: growthAlignment,
    },
  });

  return (
    <div style={{ padding: "1rem" }}>
      <h1>Chat</h1>
      {insight ? (
        <div
          style={{
            border: "1px solid #555",
            padding: "1rem",
            borderRadius: "0.5rem",
            backgroundColor: "#111",
            color: "#fff",
          }}
        >
          <h2 style={{ marginBottom: "0.5rem" }}>{insight.headline}</h2>
          <p style={{ marginBottom: "0.5rem" }}>{insight.context}</p>
          <small style={{ opacity: 0.7 }}>{insight.footer}</small>
        </div>
      ) : (
        <p>Chat available. No insights generated yet.</p>
      )}
    </div>
  );
}
