import { useEffect, useState } from "react";

/**
 * Moonshot Asymmetry Lab
 * --------------------------------------------------
 * Live telemetry view of autonomous asymmetry scans
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

  useEffect(() => {
    let alive = true;

    async function pollTelemetry() {
      try {
        const snap = await window.jupiter.invoke(
          "asymmetry:telemetry:get"
        );

        if (!alive) return;

        if (snap?.events) {
          setEvents(snap.events);
          setStatus("CONNECTED");
        }
      } catch (err) {
        console.error("[MoonshotLab] Telemetry poll failed", err);
        setStatus("ERROR");
      }
    }

    // Initial pull
    pollTelemetry();

    // Poll every 2s (deterministic, safe)
    const interval = setInterval(pollTelemetry, 2000);

    return () => {
      alive = false;
      clearInterval(interval);
    };
  }, []);

  const latestEvent = events.length > 0
    ? events[events.length - 1]
    : null;

  const surfacedTickers =
    latestEvent?.snapshot?.surfaced ?? [];

  return (
    <div style={{ padding: "32px" }}>
      <h1>Moonshot Asymmetry Lab</h1>
      <p style={{ opacity: 0.7 }}>
        Live autonomous scan telemetry · Streaming
      </p>

      <p style={{ marginTop: "12px", opacity: 0.6 }}>
        Status: {status} · Events buffered: {events.length}
      </p>

      <table
        style={{
          marginTop: "32px",
          width: "100%",
          borderCollapse: "collapse"
        }}
      >
        <thead>
          <tr style={{ textAlign: "left", opacity: 0.8 }}>
            <th>Time</th>
            <th>Regime</th>
            <th>Universe</th>
            <th>Evaluated</th>
            <th>Surfaced</th>
            <th>Latent</th>
          </tr>
        </thead>
        <tbody>
          {events
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

      {/* ============================
         SURFACED TICKERS — FULL TRUTH
         ============================ */}
      <div style={{ marginTop: "48px" }}>
        <h2>Surfaced Tickers (Latest Scan)</h2>

        {surfacedTickers.length === 0 ? (
          <p style={{ opacity: 0.6 }}>
            No tickers surfaced yet.
          </p>
        ) : (
          <table
            style={{
              marginTop: "16px",
              width: "100%",
              borderCollapse: "collapse"
            }}
          >
            <thead>
              <tr style={{ textAlign: "left", opacity: 0.8 }}>
                <th>Symbol</th>
                <th>Asymmetry Score</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {surfacedTickers.map((s, i) => (
                <tr key={`${s.symbol}-${i}`}>
                  <td>{s.symbol}</td>
                  <td>{s.asymmetryScore ?? "—"}</td>
                  <td>SURFACED</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
