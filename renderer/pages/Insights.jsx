import { useEffect, useState } from "react";
import { fetchInsightsData } from "../adapters/insightsIpcAdapter.js";
import { runGodModeInsights } from "../insights/godModeInsightsEngine.js";

export default function Insights() {
  const [data, setData] = useState(null);
  const [godMode, setGodMode] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const base = await fetchInsightsData();

        if (!mounted) return;

        const god = runGodModeInsights({
          ...base,
          marketRegime: base.marketRegime || {
            regime: "TRANSITION",
            confidence: "LOW"
          }
        });

        setData(base);
        setGodMode(god);
      } catch (e) {
        if (!mounted) return;
        setError(e?.message || "Failed to load insights");
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  if (error) {
    return (
      <div style={{ padding: 24 }}>
        <h2>Insights</h2>
        <p style={{ color: "red" }}>{error}</p>
      </div>
    );
  }

  if (!data || !godMode) {
    return (
      <div style={{ padding: 24 }}>
        <h2>Insights</h2>
        <p>Loading intelligence…</p>
      </div>
    );
  }

  const {
    exposure,
    riskFlags,
    scenarios,
    invariants,
    narrative,
    regimeImpact
  } = godMode;

  const severityColor = (s) => {
    if (s === "CRITICAL") return "#e74c3c";
    if (s === "HIGH") return "#f39c12";
    return "#aaa";
  };

  return (
    <div style={{ padding: 24, maxWidth: 1200 }}>
      <h1>Insights — God Mode</h1>

      {/* EXPOSURE */}
      <section>
        <h2>Exposure</h2>
        <ul>
          <li>Total Value: ${exposure.totalValue.toLocaleString()}</li>
          <li>Top Holding: {exposure.topHolding}</li>
          <li>Top Weight: {exposure.topWeightPct}%</li>
        </ul>
      </section>

      {/* STRUCTURAL RISK */}
      <section>
        <h2>Structural Risk</h2>
        <ul>
          <li>Fragility: {riskFlags.fragility}</li>
          <li>Correlation Risk: {riskFlags.correlationRisk}</li>
          <li>Conviction Drift: {riskFlags.convictionDrift}</li>
          <li>
            Regime Mismatch: {riskFlags.regimeMismatch} (
            {regimeImpact.regime})
          </li>
        </ul>
      </section>

      {/* INVARIANTS */}
      <section>
        <h2>Invariant Violations</h2>
        {invariants.length === 0 ? (
          <p>No violations detected.</p>
        ) : (
          invariants.map((inv, i) => (
            <div
              key={i}
              style={{
                borderLeft: `4px solid ${severityColor(inv.severity)}`,
                padding: "8px 12px",
                marginBottom: 8,
                background: "#0b1220"
              }}
            >
              <strong>{inv.rule}</strong>
              <div>{inv.message}</div>
              <div style={{ fontSize: 12, opacity: 0.7 }}>
                Severity: {inv.severity}
              </div>
            </div>
          ))
        )}
      </section>

      {/* SCENARIOS */}
      <section>
        <h2>Scenario Stress</h2>
        {scenarios.map((s, i) => (
          <div
            key={i}
            style={{
              padding: "8px 12px",
              marginBottom: 8,
              background: "#020617"
            }}
          >
            <strong>{s.name}</strong> — {s.weight}
            <div style={{ opacity: 0.8 }}>{s.assessment}</div>
          </div>
        ))}
      </section>

      {/* NARRATIVE */}
      <section>
        <h2>Executive Narrative</h2>
        <ul>
          {narrative.map((n, i) => (
            <li key={i}>{n}</li>
          ))}
        </ul>
      </section>

      <p style={{ marginTop: 24, opacity: 0.6 }}>
        God-mode insights are deterministic, read-only, and judgment-oriented.
      </p>
    </div>
  );
}
