import { useEffect, useState } from "react";
import { fetchInsightsData } from "../adapters/insightsIpcAdapter.js";
import { runGodModeInsights } from "../insights/godModeInsightsEngine.js";
import { buildConfidenceState } from "../insights/confidencePipeline.js";
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

        const god = runGodModeInsights({
          ...base,
          marketRegime:
            base.marketRegime || { regime: "TRANSITION", confidence: "LOW" }
        });

        const conf = buildConfidenceState();

        const cap = runCapitalReadinessEngine({
          confidence: conf,
          regimeImpact: god.regimeImpact || {
            regime: "TRANSITION",
            confidence: "LOW"
          },
          riskFlags: god.riskFlags || {}
        });

        if (!mounted) return;

        setGodMode(god);
        setConfidence(conf);
        setCapital(cap);
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

  if (!godMode || !confidence || !capital) {
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
    scenarios = [],
    invariants = [],
    narrative = []
  } = godMode;

  return (
    <div style={{ padding: 24, maxWidth: 1200 }}>
      <h1>Insights — God Mode</h1>

      {/* ================= EXPOSURE ================= */}
      <section>
        <h2>Exposure</h2>
        <ul>
          <li>Total Value: ${exposure?.totalValue?.toLocaleString() ?? "—"}</li>
          <li>Top Holding: {exposure?.topHolding ?? "—"}</li>
          <li>Top Weight: {exposure?.topWeightPct ?? "—"}%</li>
        </ul>
      </section>

      {/* ============ STRUCTURAL RISK ============ */}
      <section>
        <h2>Structural Risk</h2>
        <ul>
          <li>Fragility: {riskFlags?.fragility ?? "UNKNOWN"}</li>
          <li>Correlation Risk: {riskFlags?.correlationRisk ?? "UNKNOWN"}</li>
          <li>Conviction Drift: {riskFlags?.convictionDrift ?? "UNKNOWN"}</li>
          <li>Regime Mismatch: {riskFlags?.regimeMismatch ?? "UNKNOWN"}</li>
        </ul>
      </section>

      {/* ============ INVARIANTS ============ */}
      <section>
        <h2>Invariant Violations</h2>
        {invariants.length === 0 ? (
          <p>No violations detected.</p>
        ) : (
          invariants.map((v, i) => (
            <div key={i}>
              <strong>{v.rule}</strong> — {v.message}
            </div>
          ))
        )}
      </section>

      {/* ============ SCENARIO STRESS ============ */}
      <section>
        <h2>Scenario Stress</h2>
        {scenarios.map((s, i) => (
          <div key={i}>
            <strong>
              {s.name} — {s.weight}
            </strong>
            <div>{s.assessment}</div>
          </div>
        ))}
      </section>

      {/* ============ CONFIDENCE TREND ============ */}
      <section>
        <h2>Confidence Trend</h2>
        <ul>
          <li>Current: {confidence.current?.confidenceBand ?? "UNKNOWN"}</li>
          <li>Days in State: {confidence.current?.days ?? 0}</li>
          <li>
            Trend:{" "}
            {confidence.trend
              ? `${confidence.trend.direction} (${confidence.trend.velocity})`
              : "UNKNOWN"}
          </li>
          <li>Readiness: {confidence.readiness ?? "UNKNOWN"}</li>
        </ul>
      </section>

      {/* ============ CAPITAL READINESS ============ */}
      <section>
        <h2>Capital Readiness</h2>
        <ul>
          <li>State: {capital.readinessState}</li>
          <li>Confidence Support: {capital.confidenceSupport}</li>
          <li>Regime Alignment: {capital.regimeAlignment}</li>
        </ul>

        {capital.blockers?.length > 0 && (
          <>
            <h3>Deployment Blockers</h3>
            {capital.blockers.map((b, i) => (
              <div key={i}>
                <strong>{b.gate}</strong> — {b.message}
              </div>
            ))}
          </>
        )}
      </section>

      {/* ============ EXECUTIVE NARRATIVE ============ */}
      <section>
        <h2>Executive Narrative</h2>
        <ul>
          {narrative.map((n, i) => (
            <li key={i}>{n}</li>
          ))}
        </ul>
      </section>

      <p style={{ marginTop: 24, opacity: 0.6 }}>
        God-mode insights are deterministic, session-aware, and judgment-oriented.
      </p>
    </div>
  );
}
