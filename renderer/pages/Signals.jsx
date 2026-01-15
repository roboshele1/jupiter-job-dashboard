import React, { useEffect, useMemo, useState } from "react";

/**
 * SIGNALS — V2 INSTITUTIONAL RENDERER
 * ---------------------------------
 * - Read-only, deterministic
 * - Silence-by-default is a SUCCESS state
 * - Signals are situational awareness, not actions
 */

const CONFIDENCE_ORDER = { Low: 1, Medium: 2, High: 3 };

const CONFIDENCE_COLORS = {
  High: "#22c55e",
  Medium: "#facc15",
  Low: "#9ca3af",
};

function ConfidenceBadge({ level }) {
  return (
    <span
      style={{
        padding: "4px 10px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 700,
        color: "#020617",
        background: CONFIDENCE_COLORS[level] || "#9ca3af",
      }}
    >
      {level}
    </span>
  );
}

export default function Signals() {
  const [snapshot, setSnapshot] = useState(null);
  const [status, setStatus] = useState("loading");
  const [expanded, setExpanded] = useState(null);

  /* =========================
     LOAD SIGNALS SNAPSHOT
     ========================= */
  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        if (!window.jupiter?.invoke) {
          setStatus("unavailable");
          return;
        }

        const valuation = await window.jupiter.invoke("portfolio:getValuation");
        if (!alive) return;

        if (!valuation?.signalsV2) {
          setSnapshot({
            surfaced: false,
            signals: [],
            timestamp: Date.now(),
          });
          setStatus("ready");
          return;
        }

        setSnapshot(valuation.signalsV2);
        setStatus("ready");
      } catch (err) {
        console.error("[SIGNALS_RENDER_ERROR]", err);
        setStatus("error");
      }
    }

    load();
    return () => (alive = false);
  }, []);

  /* =========================
     SORTED VIEW
     ========================= */
  const signals = useMemo(() => {
    if (!snapshot?.signals) return [];
    return [...snapshot.signals].sort(
      (a, b) =>
        CONFIDENCE_ORDER[b.confidence] -
        CONFIDENCE_ORDER[a.confidence]
    );
  }, [snapshot]);

  /* =========================
     STATES
     ========================= */

  if (status === "loading") {
    return <div style={{ padding: 32 }}>Loading signals…</div>;
  }

  if (status === "unavailable" || status === "error") {
    return (
      <div style={{ padding: 32, color: "#9ca3af" }}>
        Signals unavailable — intelligence layer not initialized.
      </div>
    );
  }

  // ✅ SILENCE STATE (DESIRED)
  if (!snapshot?.surfaced || signals.length === 0) {
    return (
      <div style={{ padding: 32 }}>
        <h1>Signals</h1>

        <div
          style={{
            marginTop: 16,
            padding: 24,
            borderRadius: 12,
            background: "linear-gradient(180deg, #020617, #020617)",
            border: "1px solid #1f2937",
          }}
        >
          <h3 style={{ marginBottom: 8 }}>
            No material signals detected
          </h3>
          <p style={{ opacity: 0.7 }}>
            Portfolio conditions are stable across growth and risk dimensions.
          </p>
          <p style={{ fontSize: 13, opacity: 0.5, marginTop: 8 }}>
            This is the expected state. Signals surface only when conditions change materially.
          </p>
        </div>

        <div style={{ marginTop: 12, fontSize: 12, opacity: 0.4 }}>
          Snapshot time:{" "}
          {snapshot?.timestamp
            ? new Date(snapshot.timestamp).toLocaleString()
            : "—"}
        </div>
      </div>
    );
  }

  /* =========================
     ACTIVE SIGNALS
     ========================= */

  return (
    <div style={{ padding: 32 }}>
      <h1>Signals</h1>

      <p style={{ opacity: 0.7, marginBottom: 16 }}>
        Material portfolio or market disruptions detected.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {signals.map((s) => {
          const isOpen = expanded === s.symbol;

          return (
            <div
              key={s.symbol}
              style={{
                padding: 20,
                borderRadius: 14,
                border: "1px solid #1f2937",
                background: "#020617",
              }}
            >
              {/* HEADER */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  cursor: "pointer",
                }}
                onClick={() =>
                  setExpanded(isOpen ? null : s.symbol)
                }
              >
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>
                    {s.symbol}
                  </div>
                  <div style={{ fontSize: 13, opacity: 0.6 }}>
                    {s.assetClass}
                  </div>
                </div>

                <ConfidenceBadge level={s.confidence} />
              </div>

              {/* SUMMARY */}
              <div style={{ marginTop: 12, opacity: 0.85 }}>
                {s.materiality}
              </div>

              {/* DETAILS */}
              {isOpen && (
                <div
                  style={{
                    marginTop: 16,
                    paddingTop: 14,
                    borderTop: "1px solid #1f2937",
                    fontSize: 14,
                    opacity: 0.85,
                  }}
                >
                  <div style={{ marginBottom: 6 }}>
                    <b>Growth impact:</b> {s.growthImpact}
                  </div>
                  <div style={{ marginBottom: 6 }}>
                    <b>Risk context:</b> {s.riskContext}
                  </div>
                  <div style={{ fontSize: 12, opacity: 0.6, marginTop: 8 }}>
                    Signals provide awareness only — no actions implied.
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 16, fontSize: 12, opacity: 0.4 }}>
        Snapshot time:{" "}
        {snapshot?.timestamp
          ? new Date(snapshot.timestamp).toLocaleString()
          : "—"}
      </div>
    </div>
  );
}
