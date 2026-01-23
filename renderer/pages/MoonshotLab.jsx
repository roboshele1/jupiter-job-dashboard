import { useEffect, useRef, useState } from "react";

/**
 * Moonshot Asymmetry Lab
 * --------------------------------------------------
 * Institutional-grade live telemetry console
 *
 * HARD RULES:
 * - Read-only
 * - No scan logic
 * - No IPC mutation
 * - UI reflects engine truth only
 */

export default function MoonshotLab() {
  const [status, setStatus] = useState("CONNECTING");
  const [events, setEvents] = useState([]);

  // ===== Visibility counters (UI-only, derived) =====
  const primaryPulseRef = useRef(0);
  const deepPulseRef = useRef(0);
  const lastPulseRef = useRef(null);

  // ===== Render throttle guards =====
  const lastRenderSignatureRef = useRef(null);

  useEffect(() => {
    let alive = true;

    async function pollTelemetry() {
      try {
        const snap = await window.jupiter.invoke(
          "asymmetry:telemetry:get"
        );

        if (!alive || !snap?.events?.length) return;

        const latest = snap.events[snap.events.length - 1];

        // --- VISIBILITY PULSE TRACKING (NO ENGINE TOUCH) ---
        if (latest?.regime === "PRIMARY") {
          primaryPulseRef.current += 1;
        } else if (latest?.regime === "DEEP") {
          deepPulseRef.current += 1;
        }

        lastPulseRef.current = latest.timestamp;

        // --- RENDER SIGNATURE (THROTTLE UI REPAINTS) ---
        const signature = [
          latest.timestamp,
          latest.surfacedCount,
          latest.latentCount
        ].join("|");

        if (signature !== lastRenderSignatureRef.current) {
          lastRenderSignatureRef.current = signature;
          setEvents(snap.events);
        }

        setStatus("CONNECTED");
      } catch (err) {
        console.error("[MoonshotLab] Telemetry poll failed", err);
        setStatus("ERROR");
      }
    }

    pollTelemetry();
    const interval = setInterval(pollTelemetry, 2000);

    return () => {
      alive = false;
      clearInterval(interval);
    };
  }, []);

  const latestEvent =
    events.length > 0 ? events[events.length - 1] : null;

  /* ==================================================
     UI THROTTLE — FILTER NOISE
     ================================================== */
  const visibleEvents = events
    .filter(
      evt => evt.surfacedCount > 0 || evt.latentCount > 0
    )
    .slice(-50); // hard cap render cost

  const surfacedTickers =
    latestEvent?.snapshot?.surfaced ?? [];

  /* ============================
     DERIVED LIVE HEAD METRICS
     ============================ */
  const liveRegime = latestEvent?.regime ?? "—";
  const universeSize = latestEvent?.universeSize ?? "—";
  const evaluated = latestEvent?.evaluated ?? "—";
  const surfacedCount = latestEvent?.surfacedCount ?? 0;
  const latentCount = latestEvent?.latentCount ?? 0;
  const timestamp = latestEvent
    ? new Date(latestEvent.timestamp).toLocaleTimeString()
    : "—";

  const lastPulseTime = lastPulseRef.current
    ? new Date(lastPulseRef.current).toLocaleTimeString()
    : "—";

  return (
    <div style={{ padding: "24px" }}>
      {/* ============================
         PINNED LIVE HEAD
         ============================ */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          background: "#020617",
          border: "1px solid #1e293b",
          borderRadius: 12,
          padding: "16px 20px",
          marginBottom: 24
        }}
      >
        <h1 style={{ margin: 0 }}>Moonshot Asymmetry Lab</h1>

        <div
          style={{
            display: "flex",
            gap: 24,
            marginTop: 12,
            flexWrap: "wrap",
            fontSize: "0.9rem"
          }}
        >
          <span>Status: {status}</span>
          <span>Regime: {liveRegime}</span>
          <span>Universe: {universeSize}</span>
          <span>Evaluated: {evaluated}</span>

          <span
            style={{
              color: surfacedCount > 0 ? "#22c55e" : "#94a3b8"
            }}
          >
            Surfaced: {surfacedCount}
          </span>

          <span
            style={{
              color: latentCount > 0 ? "#38bdf8" : "#94a3b8"
            }}
          >
            Latent: {latentCount}
          </span>

          <span>Last Scan: {timestamp}</span>
        </div>

        {/* ============================
           VISIBILITY HEARTBEAT
           ============================ */}
        <div
          style={{
            marginTop: 14,
            paddingTop: 12,
            borderTop: "1px solid #1e293b",
            display: "flex",
            gap: 24,
            flexWrap: "wrap",
            fontSize: "0.8rem",
            opacity: 0.85
          }}
        >
          <span>
            🟢 Primary pulses:{" "}
            <strong>{primaryPulseRef.current}</strong>
          </span>
          <span>
            🔵 Deep pulses:{" "}
            <strong>{deepPulseRef.current}</strong>
          </span>
          <span>
            ⏱ Last activity:{" "}
            <strong>{lastPulseTime}</strong>
          </span>
        </div>
      </div>

      {/* ============================
         SCROLLABLE EVENT LEDGER
         ============================ */}
      <div
        style={{
          maxHeight: "360px",
          overflowY: "auto",
          border: "1px solid #1e293b",
          borderRadius: 12,
          padding: "12px"
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left", opacity: 0.7 }}>
              <th>Time</th>
              <th>Regime</th>
              <th>Universe</th>
              <th>Evaluated</th>
              <th>Surfaced</th>
              <th>Latent</th>
            </tr>
          </thead>
          <tbody>
            {visibleEvents
              .slice()
              .reverse()
              .map(evt => (
                <tr key={evt.id}>
                  <td>{new Date(evt.timestamp).toLocaleTimeString()}</td>
                  <td>{evt.regime}</td>
                  <td>{evt.universeSize}</td>
                  <td>{evt.evaluated}</td>
                  <td>{evt.surfacedCount}</td>
                  <td>{evt.latentCount}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* ============================
         SURFACED TICKERS (LATEST)
         ============================ */}
      <div style={{ marginTop: 32 }}>
        <h2>Surfaced Tickers (Latest Scan)</h2>

        {surfacedTickers.length === 0 ? (
          <p style={{ opacity: 0.6 }}>
            No moonshots surfaced yet — system is scanning continuously.
          </p>
        ) : (
          <div
            style={{
              display: "flex",
              gap: 12,
              flexWrap: "wrap",
              marginTop: 12
            }}
          >
            {surfacedTickers.map((s, i) => (
              <div
                key={`${s.symbol}-${i}`}
                style={{
                  padding: "8px 12px",
                  borderRadius: 999,
                  background: "#022c22",
                  border: "1px solid #22c55e",
                  color: "#22c55e",
                  fontWeight: 600
                }}
              >
                {s.symbol}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
