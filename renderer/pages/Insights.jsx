import { useEffect, useState } from "react";
import { fetchInsightsData } from "../adapters/insightsIpcAdapter.js";
import { runGodModeInsights } from "../insights/godModeInsightsEngine.js";
import { semanticColor } from "../insights/semanticColorMap.js";

export default function Insights() {
  const [data, setData] = useState(null);
  const [insights, setInsights] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const base = await fetchInsightsData();
        if (!mounted) return;

        const evaluated = runGodModeInsights({
          ...base,
          marketRegime: base.marketRegime || {
            regime: "TRANSITION",
            confidence: "UNKNOWN"
          }
        });

        setData(base);
        setInsights(evaluated);
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

  if (!data || !insights) {
    return <div style={{ padding: 24 }}>Loading insights…</div>;
  }

  const {
    exposure,
    riskFlags,
    scenarios,
    invariants,
    narrative,
    regimeImpact,
    capital
  } = insights;

  const explanations = {
    fragility: {
      LOW: "Well-balanced structure with limited concentration risk.",
      MODERATE: "Some concentration present but still manageable.",
      HIGH: "Portfolio heavily concentrated and vulnerable to shocks.",
      EXTREME: "Severe concentration creates high drawdown risk."
    },
    correlationRisk: {
      LOW: "Holdings behave independently across market conditions.",
      MODERATE: "Partial overlap in asset behavior.",
      HIGH: "Assets likely move together during stress."
    },
    convictionDrift: {
      ALIGNED: "Capital allocation matches confidence signals.",
      "OVER-ALLOCATED RELATIVE TO CONFIDENCE":
        "More capital deployed than confidence supports."
    },
    regimeMismatch: {
      LOW: "Portfolio aligned with current market regime.",
      HIGH: "Portfolio structure conflicts with regime conditions."
    }
  };

  return (
    <div style={{ padding: 24, maxWidth: 1200 }}>
      <h1>Insights</h1>

      {/* STATUS BADGES */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {[
          ["Fragility", riskFlags.fragility],
          ["Correlation", riskFlags.correlationRisk],
          ["Readiness", capital?.readinessState || "UNKNOWN"],
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
          {Object.entries(riskFlags).map(([key, value]) => (
            <li key={key} style={{ marginBottom: 6 }}>
              <strong style={{ color: semanticColor(value) }}>
                {key}: {value}
              </strong>
              {explanations[key]?.[value] && (
                <div style={{ fontSize: 13, opacity: 0.75 }}>
                  {explanations[key][value]}
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>

      {/* CAPITAL READINESS */}
      <section
        style={{
          border: `2px solid ${semanticColor(capital?.readinessState)}`,
          borderRadius: 12,
          padding: 16,
          marginTop: 20
        }}
      >
        <h2>Capital Readiness — {capital?.readinessState || "UNKNOWN"}</h2>
        <p style={{ opacity: 0.8 }}>
          This reflects whether current confidence, regime alignment, and
          portfolio structure support deploying additional capital.
        </p>
      </section>

      {/* SCENARIO STRESS */}
      <section>
        <h2>Scenario Stress</h2>
        {scenarios.map((s, i) => (
          <div
            key={i}
            style={{
              marginBottom: 10,
              padding: 10,
              borderLeft: `4px solid ${semanticColor(s.weight)}`
            }}
          >
            <strong>{s.name}</strong> — {s.weight}
            <div style={{ opacity: 0.85 }}>{s.assessment}</div>
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
        <h2>Executive Summary</h2>
        <ul>
          {narrative.slice(0, 5).map((n, i) => (
            <li key={i}>{n}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
