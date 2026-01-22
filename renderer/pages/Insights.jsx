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
    riskFlags,
    scenarios,
    invariants,
    narrative,
    regimeImpact,
    capital,
    convictionEvolution = [],
    convictionCapitalDrift = [],
    capitalReallocationPlaybook = [],
  } = insights;

  return (
    <div style={{ padding: "2rem", maxWidth: 1300 }}>
      <h1 style={{ marginBottom: "0.25rem" }}>Insights</h1>
      <p style={{ opacity: 0.65, marginBottom: "1.5rem" }}>
        Portfolio intelligence summary — read-only, authority-driven
      </p>

      {/* SYSTEM STATE BAR */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 24 }}>
        {[
          ["Fragility", riskFlags.fragility],
          ["Correlation", riskFlags.correlationRisk],
          ["Regime", regimeImpact?.regime || "UNKNOWN"],
          ["Capital", capital?.readinessState || "UNKNOWN"],
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

      {/* CONVICTION EVOLUTION */}
      <section style={{ background: "#020617", borderRadius: 14, padding: "1.5rem", marginBottom: 24 }}>
        <h2 style={{ marginBottom: 12 }}>Conviction Evolution</h2>

        {convictionEvolution.map((row) => (
          <div
            key={row.symbol}
            style={{
              display: "grid",
              gridTemplateColumns: "120px 160px 120px 1fr",
              gap: 12,
              padding: "12px 14px",
              borderRadius: 10,
              background: "#0b1220",
              border: `1px solid ${semanticColor(row.convictionZone)}`,
              marginBottom: 8,
            }}
          >
            <strong>{row.symbol}</strong>
            <span style={{ fontWeight: 700, color: semanticColor(row.convictionZone) }}>
              {row.convictionZone}
            </span>
            <span style={{ opacity: 0.75 }}>{row.daysInState} days</span>
            <span style={{ opacity: 0.85 }}>{row.rationale}</span>
          </div>
        ))}
      </section>

      {/* CONVICTION vs CAPITAL DRIFT */}
      <section style={{ background: "#020617", borderRadius: 14, padding: "1.5rem", marginBottom: 28 }}>
        <h2 style={{ marginBottom: 12 }}>Conviction vs Capital Drift</h2>

        {convictionCapitalDrift.length === 0 ? (
          <div style={{ opacity: 0.6 }}>
            No conviction–capital mismatches detected.
          </div>
        ) : (
          convictionCapitalDrift.map((row) => (
            <div
              key={row.symbol}
              style={{
                display: "grid",
                gridTemplateColumns: "120px 160px 120px 1fr",
                gap: 12,
                padding: "12px 14px",
                borderRadius: 10,
                background: "#0b1220",
                border: `1px solid ${semanticColor(row.severity)}`,
                marginBottom: 8,
              }}
            >
              <strong>{row.symbol}</strong>
              <span style={{ fontWeight: 700, color: semanticColor(row.status) }}>
                {row.status}
              </span>
              <span style={{ opacity: 0.75 }}>{row.capitalWeightPct}%</span>
              <span style={{ opacity: 0.85 }}>{row.message}</span>
            </div>
          ))
        )}
      </section>

      {/* CAPITAL REALLOCATION PLAYBOOK */}
      <section style={{ background: "#020617", borderRadius: 14, padding: "1.5rem", marginBottom: 28 }}>
        <h2 style={{ marginBottom: 12 }}>Capital Reallocation Playbook</h2>

        {capitalReallocationPlaybook.length === 0 ? (
          <div style={{ opacity: 0.6 }}>
            No actionable capital adjustments at this time.
          </div>
        ) : (
          capitalReallocationPlaybook.map((row) => (
            <div
              key={row.symbol}
              style={{
                display: "grid",
                gridTemplateColumns: "120px 140px 120px 1fr",
                gap: 12,
                padding: "12px 14px",
                borderRadius: 10,
                background: "#0b1220",
                border: `1px solid ${semanticColor(row.recommendedAction)}`,
                marginBottom: 8,
              }}
            >
              <strong>{row.symbol}</strong>
              <span style={{ fontWeight: 700, color: semanticColor(row.recommendedAction) }}>
                {row.recommendedAction}
              </span>
              <span style={{ opacity: 0.75 }}>{row.capitalBand}</span>
              <span style={{ opacity: 0.85 }}>{row.rationale}</span>
            </div>
          ))
        )}
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
            <div style={{ opacity: 0.85, marginTop: 4 }}>{s.assessment}</div>
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

      {/* EXEC SUMMARY */}
      <section style={{ background: "#0b1220", padding: "1.25rem", borderRadius: 12 }}>
        <h2>Executive Summary</h2>
        <ul style={{ marginTop: 8 }}>
          {narrative.slice(0, 5).map((n, i) => (
            <li key={i} style={{ marginBottom: 6 }}>{n}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
