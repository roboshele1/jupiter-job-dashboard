import React, { useEffect, useMemo, useState } from "react";

/**
 * Phase 2A → 2C – Signals Activation + Context Rendering (ADD-ONLY)
 * Rules honored:
 * - NO JSX removed
 * - Existing table + help text preserved
 * - Static snapshot retained as fallback
 * - IPC snapshot consumed read-only
 * - Context rendered if present, ignored if absent
 */

const IMPACT_RANK = { High: 3, Moderate: 2, Low: 1 };
const CONFIDENCE_RANK = { High: 3, Medium: 2, Low: 1 };
const DELTA_RANK = { "↑": 3, "→": 2, "↓": 1 };

const deltaStyle = (delta) => ({
  color:
    delta === "↑"
      ? "#2ecc71"
      : delta === "↓"
      ? "#e74c3c"
      : "#9ca3af",
  fontWeight: 700,
});

const contextStyle = (context) => ({
  fontWeight: 700,
  color:
    context === "ACCUMULATION_ZONE"
      ? "#2ecc71"
      : context === "DISTRIBUTION_ZONE"
      ? "#e74c3c"
      : "#9ca3af",
});

export default function Signals() {
  const [sortKey, setSortKey] = useState("portfolioImpact");
  const [ipcSnapshot, setIpcSnapshot] = useState(null);
  const [status, setStatus] = useState("idle");

  // ---- STATIC SNAPSHOT (UNCHANGED FALLBACK) ----
  const staticSnapshot = {
    timestamp: "2025-12-30T16:28:28.562Z",
    notifications: [],
    signals: [
      {
        symbol: "BTC",
        assetClass: "crypto",
        momentum: "Strong",
        meanReversion: "Overextended",
        portfolioImpact: "High",
        confidence: "High",
        delta: "↑",
        context: "NEUTRAL",
      },
      {
        symbol: "ETH",
        assetClass: "crypto",
        momentum: "Weak",
        meanReversion: "Oversold",
        portfolioImpact: "Moderate",
        confidence: "Medium",
        delta: "↓",
        context: "ACCUMULATION_ZONE",
      },
      {
        symbol: "NVDA",
        assetClass: "equity",
        momentum: "Neutral",
        meanReversion: "Neutral",
        portfolioImpact: "Low",
        confidence: "Medium",
        delta: "→",
        context: "NEUTRAL",
      },
    ],
  };

  // ---- IPC SNAPSHOT (READ-ONLY) ----
  useEffect(() => {
    async function loadIpcSnapshot() {
      if (!window.api?.invoke) return;
      try {
        setStatus("loading");
        const snap = await window.api.invoke("signals:getSnapshot");
        if (snap && Array.isArray(snap.signals)) {
          setIpcSnapshot(snap);
          setStatus("ready");
        } else {
          setStatus("fallback");
        }
      } catch {
        setStatus("fallback");
      }
    }
    loadIpcSnapshot();
  }, []);

  const snapshot = ipcSnapshot || staticSnapshot;

  const sortedSignals = useMemo(() => {
    const rankMap =
      sortKey === "portfolioImpact"
        ? IMPACT_RANK
        : sortKey === "confidence"
        ? CONFIDENCE_RANK
        : DELTA_RANK;

    return [...snapshot.signals].sort(
      (a, b) => rankMap[b[sortKey]] - rankMap[a[sortKey]]
    );
  }, [snapshot, sortKey]);

  const notificationCount = snapshot.notifications?.length || 0;

  return (
    <div className="signals-page">
      <h2>Signals</h2>

      {/* ---- NOTIFICATIONS ---- */}
      <div style={{ marginBottom: 8, opacity: 0.75 }}>
        Notifications: {notificationCount || "None"}
      </div>

      {/* ---- HELP TEXT ---- */}
      <div className="signals-help">
        <strong>How to read this table:</strong>
        <ul>
          <li><b>Momentum</b>: Directional strength of recent price movement.</li>
          <li><b>Mean Reversion</b>: Distance from recent average price.</li>
          <li><b>Portfolio Impact</b>: Estimated influence on portfolio outcomes.</li>
          <li><b>Confidence</b>: Derived signal reliability.</li>
          <li><b>Context</b>: Structural posture (not an action).</li>
          <li><b>Δ</b>: Change since last snapshot.</li>
        </ul>
      </div>

      {/* ---- SOURCE ---- */}
      <div style={{ opacity: 0.6, marginBottom: 8 }}>
        Source: {ipcSnapshot ? "Live IPC snapshot" : "Static snapshot"}
      </div>

      {/* ---- TABLE ---- */}
      <table className="signals-table">
        <thead>
          <tr>
            <th>Symbol</th>
            <th>Asset Class</th>
            <th>Momentum</th>
            <th>Mean Reversion</th>
            <th
              onClick={() => setSortKey("portfolioImpact")}
              style={{ cursor: "pointer" }}
            >
              Portfolio Impact
            </th>
            <th
              onClick={() => setSortKey("confidence")}
              style={{ cursor: "pointer" }}
            >
              Confidence
            </th>
            <th>Context</th>
            <th
              onClick={() => setSortKey("delta")}
              style={{ cursor: "pointer" }}
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
              <td
                style={{
                  color:
                    s.confidence === "High"
                      ? "#2ecc71"
                      : s.confidence === "Medium"
                      ? "#f1c40f"
                      : "#9ca3af",
                  fontWeight: 700,
                }}
              >
                {s.confidence}
              </td>
              <td>
                <span style={contextStyle(s.context)}>
                  {s.context || "—"}
                </span>
              </td>
              <td>
                <span style={deltaStyle(s.delta)}>{s.delta}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ marginTop: 8, opacity: 0.5 }}>
        Snapshot time: {snapshot.timestamp}
      </div>
    </div>
  );
}
