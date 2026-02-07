import React, { useEffect, useState } from "react";

/**
 * SIGNALS — PORTFOLIO TECHNICAL ANALYSIS
 *
 * Invariants:
 * - Renders ONLY engine-emitted technical analysis
 * - Never reads holdings directly
 * - Crypto never appears unless engine explicitly emits it
 */

export default function Signals() {
  const [snapshot, setSnapshot] = useState(null);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        const result = await window.jupiter.invoke(
          "portfolio:technicalSignals:getSnapshot"
        );

        if (!alive) return;

        setSnapshot(result);
        setStatus("ready");
      } catch (e) {
        console.error("[SIGNALS_LOAD_ERROR]", e);
        setStatus("error");
      }
    }

    load();
    return () => (alive = false);
  }, []);

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

      {symbols.length === 0 && (
        <div style={{ marginTop: 24, opacity: 0.6 }}>
          No eligible equity holdings for technical analysis.
        </div>
      )}

      <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 16 }}>
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
          </div>
        ))}
      </div>

      <div style={{ marginTop: 16, fontSize: 12, opacity: 0.4 }}>
        Snapshot time: {new Date(snapshot.asOf).toLocaleString()}
      </div>
    </div>
  );
}
