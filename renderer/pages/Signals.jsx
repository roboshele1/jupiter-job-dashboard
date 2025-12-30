import React, { useMemo, useState } from "react";

const IMPACT_RANK = { High: 3, Moderate: 2, Low: 1 };
const CONFIDENCE_RANK = { High: 3, Medium: 2, Low: 1 };
const DELTA_RANK = { "↑": 3, "→": 2, "↓": 1 };

export default function Signals() {
  const [sortKey, setSortKey] = useState("portfolioImpact");

  const snapshot = {
    timestamp: "2025-12-30T16:28:28.562Z",
    signals: [
      {
        symbol: "BTC",
        assetClass: "crypto",
        momentum: "Strong",
        meanReversion: "Overextended",
        portfolioImpact: "High",
        confidence: "High",
        delta: "↑",
      },
      {
        symbol: "ETH",
        assetClass: "crypto",
        momentum: "Weak",
        meanReversion: "Oversold",
        portfolioImpact: "Moderate",
        confidence: "Medium",
        delta: "↓",
      },
      {
        symbol: "NVDA",
        assetClass: "equity",
        momentum: "Neutral",
        meanReversion: "Neutral",
        portfolioImpact: "Low",
        confidence: "Medium",
        delta: "→",
      },
    ],
  };

  const sortedSignals = useMemo(() => {
    return [...snapshot.signals].sort((a, b) => {
      if (sortKey === "portfolioImpact") {
        return IMPACT_RANK[b.portfolioImpact] - IMPACT_RANK[a.portfolioImpact];
      }
      if (sortKey === "confidence") {
        return CONFIDENCE_RANK[b.confidence] - CONFIDENCE_RANK[a.confidence];
      }
      if (sortKey === "delta") {
        return DELTA_RANK[b.delta] - DELTA_RANK[a.delta];
      }
      return 0;
    });
  }, [sortKey, snapshot.signals]);

  return (
    <div>
      <h1>Signals</h1>

      <div style={{ marginBottom: 12 }}>
        <strong>How to read this table:</strong>
        <ul>
          <li><b>Momentum</b>: Directional strength of recent price movement.</li>
          <li><b>Mean Reversion</b>: Distance from recent average price.</li>
          <li><b>Portfolio Impact</b>: Estimated influence on portfolio outcomes.</li>
          <li><b>Confidence</b>: Derived signal reliability.</li>
          <li><b>Δ</b>: Change since last snapshot.</li>
        </ul>
      </div>

      <table width="100%" cellPadding={6}>
        <thead>
          <tr>
            <th>Symbol</th>
            <th>Asset Class</th>
            <th>Momentum</th>
            <th>Mean Reversion</th>
            <th
              style={{ cursor: "pointer" }}
              onClick={() => setSortKey("portfolioImpact")}
            >
              Portfolio Impact
            </th>
            <th
              style={{ cursor: "pointer" }}
              onClick={() => setSortKey("confidence")}
            >
              Confidence
            </th>
            <th
              style={{ cursor: "pointer" }}
              onClick={() => setSortKey("delta")}
            >
              Δ
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedSignals.map((s) => (
            <tr key={s.symbol}>
              <td>{s.symbol}</td>
              <td>{s.assetClass}</td>
              <td>{s.momentum}</td>
              <td>{s.meanReversion}</td>
              <td>{s.portfolioImpact}</td>
              <td style={{ color: s.confidence === "High" ? "#4ade80" : "#facc15" }}>
                {s.confidence}
              </td>
              <td>{s.delta}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ marginTop: 10, opacity: 0.7 }}>
        Snapshot time: {snapshot.timestamp}
      </div>
    </div>
  );
}
