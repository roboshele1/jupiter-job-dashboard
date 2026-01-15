import { useEffect, useState } from "react";
import { fetchInsightsData } from "../adapters/insightsIpcAdapter.js";
import { buildInsightsIntelligence } from "../insights/insightsAuthorityEngine.js";
import { semanticColor } from "../insights/semanticColorMap.js";

export default function Insights() {
  const [insights, setInsights] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const base = await fetchInsightsData();
        if (!mounted) return;

        const authority = buildInsightsIntelligence({
          ...base,
          marketRegime: base.marketRegime || {
            regime: "TRANSITION",
            confidence: "UNKNOWN",
          },
        });

        setInsights(authority);
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

  if (!insights) {
    return <div style={{ padding: 24 }}>Loading insights…</div>;
  }

  const {
    exposure,
    riskFlags,
    scenarios,
    invariants,
    narrative,
    regimeImpact,
    capital,
  } = insights;

  const explanations = {
    fragility: {
      LOW: "Portfolio structure is well diversified with limited concentration risk.",
      MODERATE: "Some concentration exists, but risk remains manageable.",
      HIGH: "Portfolio is concentrated and more vulnerable to shocks.",
      EXTREME: "Severe concentration creates elevated drawdown risk.",
    },
    correlationRisk: {
      LOW: "Holdings behave independently across market conditions.",
      MODERATE: "Some overlap in asset behavior during stress.",
      HIGH: "Assets are likely to move together during market stress.",
    },
    convictionDrift: {
      ALIGNED: "Position sizing reflects current confidence signals.",
      "OVER-ALLOCATED RELATIVE TO CONFIDENCE":
        "Capital exposure exceeds what confidence signals justify.",
    },
    regimeMismatch: {
      LOW: "Portfolio structure aligns with the current market regime.",
      HIGH: "Portfolio positioning conflicts with prevailing market conditions.",
    },
  };

  return (
    <div style={{ padding: "2rem", maxWidth: 1300 }}>
      <h1 style={{ marginBottom: "0.25rem" }}>Insights</h1>
      <p style={{ opacity: 0.65, marginBottom: "1.5rem" }}>
        Portfolio intelligence summary — read-only, authority-driven
      </p>

      {/* SYSTEM STATE BAR */}
      <div
        style={{
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
          marginBottom: 24,
        }}
      >
        {[
          ["Fragility", riskFlags.fragility],
          ["Correlation", riskFlags.correlationRisk],
          ["Readiness", capital?.readinessState || "UNKNOWN"],
          ["Regime", regimeImpact?.regime || "UNKNOWN"],
          ["Violations", invariants.length],
        ].map(([label, value]) => (
          <span
            key={label}
            style={{
              padding: "6px 12px",
              borderRadius: 999,
              background: semanticColor(value),
              color: "#020617",
              fontWeight: 700,
              fontSize: 12,
            }}
          >
            {label}: {value}
          </span>
        ))}
      </div>

      {/* EXPOSURE */}
      <section
        style={{
          background: "#0b1220",
          padding: "1.25rem",
          borderRadius: 12,
          marginBottom: 20,
        }}
      >
        <h2>Exposure</h2>
        <ul style={{ marginTop: 8, opacity: 0.85 }}>
          <li>Total Value: ${exposure.totalValue.toLocaleString()}</li>
          <li>Top Holding: {exposure.topHolding}</li>
          <li>Top Weight: {exposure.topWeightPct}%</li>
        </ul>
      </section>

      {/* STRUCTURAL RISK */}
      <section
        style={{
          background: "#0f172a",
          padding: "1.25rem",
          borderRadius: 12,
          marginBottom: 20,
        }}
      >
        <h2>Structural Risk</h2>
        <ul style={{ marginTop: 10 }}>
          {Object.entries(riskFlags).map(([key, value]) => (
            <li key={key} style={{ marginBottom: 12 }}>
              <strong style={{ color: semanticColor(value) }}>
                {key}: {value}
              </strong>
              {explanations[key]?.[value] && (
                <div style={{ fontSize: 13, opacity: 0.75, marginTop: 4 }}>
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
          borderRadius: 14,
          padding: "1.25rem",
          marginBottom: 24,
        }}
      >
        <h2>Capital Readiness — {capital?.readinessState || "UNKNOWN"}</h2>
        <p style={{ opacity: 0.8, marginTop: 6 }}>
          {capital?.summary}
        </p>
      </section>

      {/* SCENARIO STRESS */}
      <section style={{ marginBottom: 24 }}>
        <h2>Scenario Stress</h2>
        {scenarios.map((s, i) => (
          <div
            key={i}
            style={{
              marginTop: 10,
              padding: "10px 12px",
              borderLeft: `4px solid ${semanticColor(s.weight)}`,
              background: "#020617",
              borderRadius: 6,
            }}
          >
            <strong>{s.name}</strong> — {s.weight}
            <div style={{ opacity: 0.85, marginTop: 4 }}>
              {s.assessment}
            </div>
          </div>
        ))}
      </section>

      {/* INVARIANTS */}
      <section style={{ marginBottom: 24 }}>
        <h2>Invariant Violations</h2>
        {invariants.length === 0 ? (
          <p style={{ color: "#22c55e" }}>No violations detected.</p>
        ) : (
          invariants.map((inv, i) => (
            <div
              key={i}
              style={{
                color: semanticColor(inv.severity),
                marginBottom: 8,
                fontWeight: 600,
              }}
            >
              {inv.rule}: {inv.message}
            </div>
          ))
        )}
      </section>

      {/* EXECUTIVE SUMMARY */}
      <section
        style={{
          background: "#0b1220",
          padding: "1.25rem",
          borderRadius: 12,
        }}
      >
        <h2>Executive Summary</h2>
        <ul style={{ marginTop: 8 }}>
          {narrative.slice(0, 5).map((n, i) => (
            <li key={i} style={{ marginBottom: 6 }}>
              {n}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
