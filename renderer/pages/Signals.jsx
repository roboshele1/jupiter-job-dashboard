import React, { useEffect, useState } from "react";

/**
 * SIGNALS — PORTFOLIO TECHNICAL ANALYSIS
 *
 * Invariants:
 * - Renders engine-emitted technical analysis only
 * - Append-only UI logic
 * - Interpretation is displayed if present, ignored if absent
 * - Refresh mirrors Portfolio refresh semantics
 */

export default function Signals() {
  const [snapshot, setSnapshot] = useState(null);
  const [status, setStatus] = useState("loading");
  const [refreshing, setRefreshing] = useState(false);

  async function loadSnapshot() {
    try {
      const result = await window.jupiter.invoke(
        "portfolio:technicalSignals:getSnapshot"
      );
      setSnapshot(result);
      setStatus("ready");
    } catch (e) {
      console.error("[SIGNALS_LOAD_ERROR]", e);
      setStatus("error");
    }
  }

  useEffect(() => {
    let alive = true;

    async function load() {
      if (!alive) return;
      await loadSnapshot();
    }

    load();
    return () => (alive = false);
  }, []);

  /* =========================
     Manual Refresh (AUTHORITATIVE)
     ========================= */
  async function refreshSignals() {
    try {
      setRefreshing(true);

      // 🔑 Recompute portfolio (prices + TA)
      await window.jupiter.refreshPortfolioValuation();

      // 🔑 Pull fresh technical snapshot
      await loadSnapshot();
    } catch (e) {
      console.error("[SIGNALS_REFRESH_ERROR]", e);
      setStatus("error");
    } finally {
      setRefreshing(false);
    }
  }

  if (status === "loading") {
    return <div style={{ padding: 32 }}>Loading technical analysis…</div>;
  }

  if (status === "error" || !snapshot) {
    return (
      <div style={{ padding: 32, opacity: 0.6 }}>
        Technical analysis unavailable.
      </div>
    );
  }

  const symbols = Object.values(snapshot.symbols || {});

  return (
    <div style={{ padding: 32 }}>
      <h1>Portfolio Technical Analysis</h1>

      {/* =========================
          Refresh Controls
         ========================= */}
      <div style={{ marginTop: 12, marginBottom: 20 }}>
        <button onClick={refreshSignals} disabled={refreshing}>
          {refreshing ? "Refreshing…" : "Refresh Technical Analysis"}
        </button>
      </div>

      {symbols.length === 0 && (
        <div style={{ marginTop: 24, opacity: 0.6 }}>
          No eligible equity holdings for technical analysis.
        </div>
      )}

      <div
        style={{
          marginTop: 24,
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        {symbols.map((s) => (
          <div
            key={s.symbol}
            style={{
              padding: 20,
              borderRadius: 14,
              border: "1px solid #1f2937",
              background: "#020617",
            }}
          >
            <div style={{ fontSize: 16, fontWeight: 700 }}>{s.symbol}</div>

            <div style={{ marginTop: 8, fontSize: 14 }}>
              <div>Price: {s.price ?? "—"}</div>
              <div>Trend: {s.trend}</div>
              <div>Momentum: {s.momentum}</div>
              <div>Location: {s.location}</div>
            </div>

            <div style={{ marginTop: 10, fontSize: 12, opacity: 0.6 }}>
              SMA20: {s.movingAverages?.sma20 ?? "—"} &nbsp;|&nbsp;
              SMA50: {s.movingAverages?.sma50 ?? "—"} &nbsp;|&nbsp;
              SMA200W: {s.movingAverages?.sma200w ?? "—"}
            </div>

            {/* 🔹 INTERPRETATION (APPEND-ONLY) */}
            {s.interpretation && (
              <div
                style={{
                  marginTop: 14,
                  paddingTop: 12,
                  borderTop: "1px solid #1f2937",
                  fontSize: 13,
                  lineHeight: 1.5,
                }}
              >
                <div style={{ fontWeight: 600, marginBottom: 6 }}>
                  Interpretation
                </div>

                {s.interpretation.summary && (
                  <div style={{ opacity: 0.85 }}>
                    {s.interpretation.summary}
                  </div>
                )}

                {Array.isArray(s.interpretation.details) &&
                  s.interpretation.details.length > 0 && (
                    <ul
                      style={{
                        marginTop: 8,
                        paddingLeft: 18,
                        opacity: 0.75,
                      }}
                    >
                      {s.interpretation.details.map((d, i) => (
                        <li key={i}>{d}</li>
                      ))}
                    </ul>
                  )}
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{ marginTop: 16, fontSize: 12, opacity: 0.4 }}>
        Snapshot time: {new Date(snapshot.asOf).toLocaleString()}
      </div>
    </div>
  );
}

