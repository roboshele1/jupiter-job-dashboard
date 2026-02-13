// renderer/pages/SystemState.jsx
// System State — Live IPC-backed intelligence surface (DET, read-only)

import React, { useEffect, useState } from "react";

export default function SystemState() {
  const [state, setState] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const res = await window.jupiter.invoke("system:getState");
        if (mounted) setState(res);
      } catch (err) {
        console.error("System State IPC failed:", err);
      }
    }

    load();
    const id = setInterval(load, 5000); // refresh loop

    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, []);

  if (!state) {
    return (
      <div style={{ padding: 24 }}>
        <h1>System State</h1>
        <p>Loading intelligence surface…</p>
      </div>
    );
  }

  const { awareness, decision, signals, risk } = state;

  return (
    <div style={{ padding: 24 }}>
      <h1>System State</h1>
      <p>Awareness, decision posture, signals, and risk convergence.</p>

      {/* Awareness */}
      <section className="card">
        <h2>Awareness Engine</h2>
        <p>System State: {awareness.systemState}</p>
        <p>Attention Level: {awareness.attentionLevel}</p>
        <p>Risk Regime: {awareness.riskRegime}</p>
        <p>Signal Surface: {awareness.signalSurface}</p>
      </section>

      {/* Decision */}
      <section className="card">
        <h2>Decision Interpreter</h2>
        <p>System Posture: {decision.systemPosture}</p>
        <p>Capital State: {decision.capitalState}</p>
        <p>Confidence Band: {decision.confidenceBand}</p>
      </section>

      {/* Signals */}
      <section className="card">
        <h2>Signals</h2>
        <p>Available: {String(signals.available)}</p>
        <p>Signal Count: {signals.signalsV1?.signals?.length || 0}</p>
        <p>Surfaced: {String(signals.signalsV2?.surfaced)}</p>
      </section>

      {/* Risk */}
      <section className="card">
        <h2>Risk Normalization</h2>
        <p>Regime: {risk.regime}</p>
        <p>Normalized: {String(risk.normalized)}</p>
      </section>
    </div>
  );
}
