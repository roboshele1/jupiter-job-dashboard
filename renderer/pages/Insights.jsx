import { useEffect, useState } from "react";
import { fetchInsightsData } from "../adapters/insightsIpcAdapter.js";
import { runGodModeInsights } from "../insights/godModeInsightsEngine.js";
import { semanticColor } from "../insights/semanticColorMap.js";

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
            confidence: "UNKNOWN"
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
    return () => (mounted = false);
  }, []);

  if (error) {
    return <div style={{ padding: 24, color: "#ef4444" }}>{error}</div>;
  }

  if (!data || !godMode) {
    return <div style={{ padding: 24 }}>Loading insights…</div>;
  }

  const {
    exposure,
    riskFlags,
    scenarios,
    invariants,
    narrative,
    regimeImpact
  } = godMode;

  return (
    <div style={{ padding: 24, maxWidth: 1200 }}>
      <h1>Insights — God Mode</h1>

      {/* BADGES */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {[
          ["Fragility", riskFlags.fragility],
          ["Correlation", riskFlags.correlationRisk],
          ["Readiness", godMode.capital?.readinessState || "UNKNOWN"],
          ["Regime", regimeImpact?.regime || "UNKNOWN"],
          ["Violations", invariants.length]
        ].map(([label, value]) => (
          <span
            key={label}
            style={{
              padding: "4px 10px",
              borderRadius: 999,
              background: semanticColor(value),
              color: "#020617",
              fontWeight: 600,
              fontSize: 12
            }}
          >
            {label}: {value}
          </span>
        ))}
      </div>

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
          {Object.entries(riskFlags).map(([k, v]) => (
            <li key={k} style={{ color: semanticColor(v) }}>
              {k}: {v}
            </li>
          ))}
        </ul>
      </section>

      {/* CAPITAL READINESS */}
      <section
        style={{
          border: `2px solid ${semanticColor(
            godMode.capital?.readinessState
          )}`,
          borderRadius: 12,
          padding: 16,
          marginTop: 16
        }}
      >
        <h2>
          Capital Readiness — {godMode.capital?.readinessState || "UNKNOWN"}
        </h2>
        <p>
          Confidence, regime alignment, and structural posture determine capital
          deployability.
        </p>
      </section>

      {/* SCENARIOS */}
      <section>
        <h2>Scenario Stress</h2>
        {scenarios.map((s, i) => (
          <div
            key={i}
            style={{
              marginBottom: 8,
              padding: 8,
              borderLeft: `4px solid ${semanticColor(s.weight)}`
            }}
          >
            <strong>{s.name}</strong> — {s.weight}
            <div>{s.assessment}</div>
          </div>
        ))}
      </section>

      {/* INVARIANTS */}
      <section>
        <h2>Invariant Violations</h2>
        {invariants.length === 0 ? (
          <p style={{ color: "#22c55e" }}>No violations detected.</p>
        ) : (
          invariants.map((inv, i) => (
            <div
              key={i}
              style={{
                color: semanticColor(inv.severity),
                marginBottom: 6
              }}
            >
              {inv.rule}: {inv.message}
            </div>
          ))
        )}
      </section>

      {/* NARRATIVE */}
      <section>
        <h2>Executive Narrative</h2>
        <ul>
          {narrative.slice(0, 5).map((n, i) => (
            <li key={i}>{n}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
