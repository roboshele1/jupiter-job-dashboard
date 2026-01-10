import React, { useEffect, useMemo, useState } from "react";

/**
 * Phase 2A → 2C – Signals Activation + Context Rendering (ADD-ONLY)
 * Phase D29.1 – Signal Detail Panel (APPEND-ONLY)
 * Phase D30.1 – Signals × Portfolio Bridge (READ-ONLY, APPEND-ONLY)
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

  // D29.1
  const [selectedSignal, setSelectedSignal] = useState(null);

  // D30.1 — portfolio symbol bridge (read-only)
  const [portfolioSymbols, setPortfolioSymbols] = useState(null);

  // ---- STATIC SNAPSHOT (UNCHANGED FALLBACK) ----
  const staticSnapshot = {
    timestamp: "2025-12-30T16:28:28.562Z",
    notifications: [],
    signals: [],
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

  // ---- PORTFOLIO SYMBOL BRIDGE (READ-ONLY) ----
  useEffect(() => {
    async function loadPortfolioSymbols() {
      try {
        if (!window.jupiter?.getPortfolioValuation) return;
        const data = await window.jupiter.getPortfolioValuation();
        if (Array.isArray(data?.positions)) {
          setPortfolioSymbols(new Set(data.positions.map(p => p.symbol)));
        }
      } catch {
        // silent failure — non-critical context
      }
    }
    loadPortfolioSymbols();
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
  const inPortfolio =
    selectedSignal &&
    portfolioSymbols &&
    portfolioSymbols.has(selectedSignal.symbol);

  return (
    <div className="signals-page">
      <h2>Signals</h2>

      <div style={{ marginBottom: 8, opacity: 0.75 }}>
        Notifications: {notificationCount || "None"}
      </div>

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

      <div style={{ opacity: 0.6, marginBottom: 8 }}>
        Source: {ipcSnapshot ? "Live IPC snapshot" : "Static snapshot"}
      </div>

      <table className="signals-table">
        <thead>
          <tr>
            <th>Symbol</th>
            <th>Asset Class</th>
            <th>Momentum</th>
            <th>Mean Reversion</th>
            <th onClick={() => setSortKey("portfolioImpact")} style={{ cursor: "pointer" }}>
              Portfolio Impact
            </th>
            <th onClick={() => setSortKey("confidence")} style={{ cursor: "pointer" }}>
              Confidence
            </th>
            <th>Context</th>
            <th onClick={() => setSortKey("delta")} style={{ cursor: "pointer" }}>
              Δ
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedSignals.map((s) => (
            <tr
              key={s.symbol}
              onClick={() => setSelectedSignal(s)}
              style={{ cursor: "pointer" }}
            >
              <td>{s.symbol}</td>
              <td>{s.assetClass}</td>
              <td>{s.momentum}</td>
              <td>{s.meanReversion}</td>
              <td>{s.portfolioImpact}</td>
              <td style={{ fontWeight: 700 }}>{s.confidence}</td>
              <td><span style={contextStyle(s.context)}>{s.context || "—"}</span></td>
              <td><span style={deltaStyle(s.delta)}>{s.delta}</span></td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ---- SIGNAL DETAIL PANEL (EXTENDED D30.1) ---- */}
      {selectedSignal && (
        <div
          style={{
            marginTop: 16,
            padding: "1rem",
            background: "#020617",
            borderRadius: "10px",
            border: "1px solid #0f172a",
          }}
        >
          <h3>{selectedSignal.symbol} — Signal Insight</h3>

          <div style={{ marginTop: 8 }}>
            <strong>Portfolio Exposure:</strong>{" "}
            <span
              style={{
                fontWeight: 700,
                color: inPortfolio ? "#2ecc71" : "#9ca3af",
              }}
            >
              {portfolioSymbols
                ? inPortfolio
                  ? "IN PORTFOLIO"
                  : "NOT IN PORTFOLIO"
                : "UNKNOWN"}
            </span>
          </div>

          <div style={{ marginTop: 8 }}>
            <strong>Context:</strong>{" "}
            <span style={contextStyle(selectedSignal.context)}>
              {selectedSignal.context || "NEUTRAL"}
            </span>
          </div>

          <div style={{ marginTop: 8 }}>
            <strong>Δ (Change):</strong>{" "}
            <span style={deltaStyle(selectedSignal.delta)}>
              {selectedSignal.delta}
            </span>{" "}
            since the previous snapshot.
          </div>

          <ul style={{ marginTop: 12, opacity: 0.85 }}>
            <li><b>Momentum:</b> {selectedSignal.momentum}</li>
            <li><b>Mean Reversion:</b> {selectedSignal.meanReversion}</li>
            <li><b>Portfolio Impact:</b> {selectedSignal.portfolioImpact}</li>
            <li><b>Confidence:</b> {selectedSignal.confidence}</li>
          </ul>
        </div>
      )}

      <div style={{ marginTop: 8, opacity: 0.5 }}>
        Snapshot time: {snapshot.timestamp}
      </div>
    </div>
  );
}
