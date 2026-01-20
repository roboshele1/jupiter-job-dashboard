import React, { useEffect, useState } from "react";

/**
 * MOONSHOT ASYMMETRY LAB
 * Live, transparent, institutional-grade scan console
 * Engines are read-only consumers
 */

export default function MoonshotLab() {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastRun, setLastRun] = useState(null);
  const [expanded, setExpanded] = useState({});

  async function runScan() {
    setLoading(true);
    try {
      const universe = await window.jupiter.invoke("market:universe:get");
      const scan = await window.jupiter.invoke("asymmetry:scan", { universe });
      setResults(scan);
      setLastRun(new Date().toISOString());
    } catch (e) {
      console.error("Moonshot scan failed:", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    runScan();
  }, []);

  if (loading || !results) {
    return <div style={{ padding: "2rem" }}>Running asymmetry scan…</div>;
  }

  const { surfaced = [], latent = [], rejected = [] } = results;

  function renderRow(r, i, type) {
    return (
      <React.Fragment key={`${type}-${r.symbol}-${i}`}>
        <tr
          onClick={() =>
            setExpanded((p) => ({ ...p, [`${type}-${i}`]: !p[`${type}-${i}`] }))
          }
          style={{ cursor: "pointer" }}
        >
          <td>{r.symbol}</td>
          <td>{type}</td>
          <td>{r.asymmetryScore}</td>
          <td>{r.regime || "—"}</td>
          <td>{r.status}</td>
          <td>{r.lastEvaluated || "—"}</td>
        </tr>

        {expanded[`${type}-${i}`] && (
          <tr>
            <td colSpan={6} style={{ background: "#0f172a" }}>
              <div style={{ fontSize: "0.8rem" }}>
                <strong>Signal Breakdown</strong>
                {Object.entries(r.signalBreakdown || {}).map(([k, v]) => (
                  <div
                    key={k}
                    style={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <span>{k}</span>
                    <span>{v}</span>
                  </div>
                ))}

                {Array.isArray(r.disqualificationReasons) && (
                  <>
                    <strong style={{ marginTop: "0.5rem", display: "block" }}>
                      Rejection Reasons
                    </strong>
                    <ul>
                      {r.disqualificationReasons.map((d, j) => (
                        <li key={j}>{d}</li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            </td>
          </tr>
        )}
      </React.Fragment>
    );
  }

  return (
    <div style={{ padding: "2rem", height: "100%", overflow: "hidden" }}>
      <h1>Moonshot Asymmetry Lab</h1>
      <p style={{ opacity: 0.8 }}>
        Autonomous asymmetric intelligence — full transparency, no heuristics.
      </p>

      <div style={{ marginBottom: "1rem" }}>
        <button onClick={runScan}>Run Scan</button>
        {lastRun && (
          <span style={{ marginLeft: "1rem", fontSize: "0.75rem" }}>
            Last run: {new Date(lastRun).toLocaleString()}
          </span>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1.5rem" }}>
        <section>
          <h3>Surfaced (High Conviction)</h3>
          <table width="100%" cellPadding="8">
            <thead>
              <tr>
                <th align="left">Symbol</th>
                <th align="left">Bucket</th>
                <th align="left">Score</th>
                <th align="left">Regime</th>
                <th align="left">Status</th>
                <th align="left">Evaluated</th>
              </tr>
            </thead>
            <tbody>
              {surfaced.map((r, i) => renderRow(r, i, "SURFACED"))}
            </tbody>
          </table>
        </section>

        <section>
          <h3>Latent (Developing Asymmetry)</h3>
          <table width="100%" cellPadding="8">
            <thead>
              <tr>
                <th align="left">Symbol</th>
                <th align="left">Bucket</th>
                <th align="left">Score</th>
                <th align="left">Regime</th>
                <th align="left">Status</th>
                <th align="left">Evaluated</th>
              </tr>
            </thead>
            <tbody>
              {latent.map((r, i) => renderRow(r, i, "LATENT"))}
            </tbody>
          </table>
        </section>

        <section>
          <h3>Rejected (Full Audit)</h3>
          <table width="100%" cellPadding="8">
            <thead>
              <tr>
                <th align="left">Symbol</th>
                <th align="left">Bucket</th>
                <th align="left">Score</th>
                <th align="left">Regime</th>
                <th align="left">Status</th>
                <th align="left">Evaluated</th>
              </tr>
            </thead>
            <tbody>
              {rejected.map((r, i) => renderRow(r, i, "REJECTED"))}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
}
