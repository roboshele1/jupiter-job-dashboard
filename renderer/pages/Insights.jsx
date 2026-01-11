import { useEffect, useState } from "react";
import { fetchInsightsData } from "../adapters/insightsIpcAdapter.js";
import { runGodModeInsights } from "../insights/godModeInsightsEngine.js";
import { runConfidenceTrendEngine } from "../insights/confidenceTrendEngine.js";
import { runCapitalReadinessEngine } from "../insights/capitalReadinessEngine.js";

export default function Insights() {
  const [godMode, setGodMode] = useState(null);
  const [confidence, setConfidence] = useState(null);
  const [capital, setCapital] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const base = await fetchInsightsData();
        if (!mounted) return;

        const marketRegime =
          base?.marketRegime?.regime
            ? base.marketRegime
            : { regime: "TRANSITION", confidence: "LOW" };

        const god = runGodModeInsights({
          ...base,
          marketRegime
        });

        // Adapter may not provide confidenceHistory yet — handle safely
        const confidenceHistory = Array.isArray(base?.confidenceHistory)
          ? base.confidenceHistory
          : [];

        const confidenceOut = runConfidenceTrendEngine(confidenceHistory);

        const capitalOut = runCapitalReadinessEngine({
          confidence: confidenceOut,
          regimeImpact: god?.regimeImpact || {
            regime: marketRegime.regime,
            confidence: marketRegime.confidence,
            mismatch: "UNKNOWN"
          },
          riskFlags: god?.riskFlags || {
            fragility: "UNKNOWN",
            correlationRisk: "UNKNOWN"
          }
        });

        if (!mounted) return;

        setGodMode(god);
        setConfidence(confidenceOut);
        setCapital(capitalOut);
      } catch (e) {
        if (!mounted) return;
        setError(e?.message || "Failed to load Insights");
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
        <p style={{ color: "#e74c3c" }}>{error}</p>
      </div>
    );
  }

  if (!godMode || !confidence || !capital) {
    return (
      <div style={{ padding: 24 }}>
        <h2>Insights</h2>
        <p>Loading intelligence…</p>
      </div>
    );
  }

  const exposure = godMode?.exposure || {
    totalValue: 0,
    topHolding: "UNKNOWN",
    topWeightPct: 0
  };

  const riskFlags = godMode?.riskFlags || {
    fragility: "UNKNOWN",
    correlationRisk: "UNKNOWN",
    convictionDrift: "UNKNOWN",
    regimeMismatch: "UNKNOWN"
  };

  const regimeImpact = godMode?.regimeImpact || {
    regime: "UNKNOWN"
  };

  const invariants = Array.isArray(godMode?.invariants) ? godMode.invariants : [];
  const scenarios = Array.isArray(godMode?.scenarios) ? godMode.scenarios : [];
  const narrative = Array.isArray(godMode?.narrative) ? godMode.narrative : [];

  const severityColor = (s) => {
    if (s === "CRITICAL") return "#e74c3c";
    if (s === "HIGH") return "#f39c12";
    return "#aaa";
  };

  const confCurrentBand = confidence?.current?.confidenceBand || "UNKNOWN";
  const confDays = Number.isFinite(confidence?.current?.days) ? confidence.current.days : 0;
  const confTrendDir = confidence?.trend?.direction || "UNKNOWN";
  const confTrendVel = confidence?.trend?.velocity || "UNKNOWN";
  const confReadiness = confidence?.readiness || "UNKNOWN";
  const confAlerts = Array.isArray(confidence?.alerts) ? confidence.alerts : [];

  const capState = capital?.readinessState || "UNKNOWN";
  const capSupport = capital?.confidenceSupport || "UNKNOWN";
  const capRegime = capital?.regimeAlignment || "UNKNOWN";
  const capBlockers = Array.isArray(capital?.blockers) ? capital.blockers : [];

  return (
    <div style={{ padding: 24, maxWidth: 1200 }}>
      <h1>Insights — God Mode</h1>

      <section>
        <h2>Exposure</h2>
        <ul>
          <li>Total Value: ${Number(exposure.totalValue || 0).toLocaleString()}</li>
          <li>Top Holding: {exposure.topHolding || "UNKNOWN"}</li>
          <li>Top Weight: {Number(exposure.topWeightPct || 0)}%</li>
        </ul>
      </section>

      <section>
        <h2>Structural Risk</h2>
        <ul>
          <li>Fragility: {riskFlags.fragility}</li>
          <li>Correlation Risk: {riskFlags.correlationRisk}</li>
          <li>Conviction Drift: {riskFlags.convictionDrift}</li>
          <li>
            Regime Mismatch: {riskFlags.regimeMismatch} ({regimeImpact.regime})
          </li>
        </ul>
      </section>

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

      <section>
        <h2>Scenario Stress</h2>
        {scenarios.length === 0 ? (
          <p>No scenarios available.</p>
        ) : (
          scenarios.map((s, i) => (
            <div
              key={i}
              style={{
                padding: "8px 12px",
                marginBottom: 8,
                background: "#020617"
              }}
            >
              <strong>{s.name}</strong> — {s.weight || "UNKNOWN"}
              <div style={{ opacity: 0.8 }}>{s.assessment}</div>
            </div>
          ))
        )}
      </section>

      <section>
        <h2>Confidence Trend</h2>
        <ul>
          <li>Current: {confCurrentBand}</li>
          <li>Days in State: {confDays}</li>
          <li>Trend: {confTrendDir} ({confTrendVel})</li>
          <li>Readiness: {confReadiness}</li>
        </ul>

        {confAlerts.length > 0 && (
          <>
            <h4>Confidence Alerts</h4>
            {confAlerts.map((a, i) => (
              <div
                key={i}
                style={{
                  borderLeft: `4px solid ${severityColor(a.severity)}`,
                  padding: "8px 12px",
                  marginBottom: 8,
                  background: "#0b1220"
                }}
              >
                {a.message}
              </div>
            ))}
          </>
        )}
      </section>

      <section>
        <h2>Capital Readiness</h2>
        <ul>
          <li>Readiness State: {capState}</li>
          <li>Confidence Support: {capSupport}</li>
          <li>Regime Alignment: {capRegime}</li>
        </ul>

        {capBlockers.length > 0 && (
          <>
            <h4>Deployment Blockers</h4>
            {capBlockers.map((b, i) => (
              <div
                key={i}
                style={{
                  borderLeft: `4px solid ${severityColor(b.severity)}`,
                  padding: "8px 12px",
                  marginBottom: 8,
                  background: "#0b1220"
                }}
              >
                <strong>{b.gate}</strong> — {b.message}
              </div>
            ))}
          </>
        )}
      </section>

      <section>
        <h2>Executive Narrative</h2>
        {narrative.length === 0 ? (
          <p>No narrative available.</p>
        ) : (
          <ul>
            {narrative.map((n, i) => (
              <li key={i}>{n}</li>
            ))}
          </ul>
        )}
      </section>

      <p style={{ marginTop: 24, opacity: 0.6 }}>
        God-mode insights are deterministic, read-only, and judgment-oriented.
      </p>
    </div>
  );
}
