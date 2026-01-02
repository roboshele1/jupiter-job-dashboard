import React, { useEffect, useMemo, useState } from "react";

/**
 * Phase 2A – Signals Activation (ADD-ONLY)
 * Rules honored:
 * - NO JSX removed
 * - Existing table + "How to read this table" preserved
 * - Live data attempted, static snapshot retained as fallback
 */

const IMPACT_RANK = { High: 3, Moderate: 2, Low: 1 };
const CONFIDENCE_RANK = { High: 3, Medium: 2, Low: 1 };
const DELTA_RANK = { "↑": 3, "→": 2, "↓": 1 };

export default function Signals() {
  const [sortKey, setSortKey] = useState("portfolioImpact");
  const [liveSnapshot, setLiveSnapshot] = useState(null);
  const [status, setStatus] = useState("idle");

  // ---- EXISTING STATIC SNAPSHOT (UNCHANGED) ----
  const staticSnapshot = {
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

  // ---- Phase 2A: ATTEMPT LIVE SNAPSHOT (NON-BLOCKING) ----
  useEffect(() => {
    async function loadLive() {
      if (!window.api?.getSignalsSnapshot) return;
      try {
        setStatus("loading");
        const snap = await window.api.getSignalsSnapshot();
        if (snap?.signals?.length) {
          setLiveSnapshot(snap);
          setStatus("ready");
        } else {
          setStatus("fallback");
        }
      } catch (e) {
        console.warn("[SIGNALS] Live snapshot unavailable, using static.");
        setStatus("fallback");
      }
    }
    loadLive();
  }, []);

  const snapshot = liveSnapshot || staticSnapshot;

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

  return (
    <div className="signals-page">
      <h2>Signals</h2>

      {/* ---- EXISTING HELP TEXT (PRESERVED) ---- */}
      <div className="signals-help">
        <strong>How to read this table:</strong>
        <ul>
          <li><b>Momentum</b>: Directional strength of recent price movement.</li>
          <li><b>Mean Reversion</b>: Distance from recent average price.</li>
          <li><b>Portfolio Impact</b>: Estimated influence on portfolio outcomes.</li>
          <li><b>Confidence</b>: Derived signal reliability.</li>
          <li><b>Δ</b>: Change since last snapshot.</li>
        </ul>
      </div>

      {/* ---- STATUS BADGE (ADD-ONLY) ---- */}
      <div style={{ opacity: 0.6, marginBottom: 8 }}>
        Source: {liveSnapshot ? "Live snapshot" : "Static snapshot"}
      </div>

      {/* ---- EXISTING TABLE (PRESERVED) ---- */}
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
                      ? "lime"
                      : s.confidence === "Medium"
                      ? "gold"
                      : "gray",
                }}
              >
                {s.confidence}
              </td>
              <td>{s.delta}</td>
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

