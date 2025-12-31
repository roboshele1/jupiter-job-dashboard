// renderer/pages/RiskCentre.jsx
import React from "react";
import { usePortfolioSnapshotStore } from "../state/portfolioSnapshotStore";

/**
 * RISK CENTRE — READ ONLY
 * V16 FINAL — CANONICAL PRESENTATION
 *
 * — ZERO logic changes
 * — ZERO snapshot mutations
 * — Canonical color tokens ONLY
 * — Exposure distribution bars
 * — Holding concentration donut
 * — Deterministic, scalable, frozen UI contract
 */

/**
 * CANONICAL COLOR TOKENS
 * (Single-source design contract shared across tabs)
 */
const COLORS = {
  bg: "#0B1220",
  panel: "#111827",
  panelAlt: "#0F172A",
  border: "#1F2937",
  textPrimary: "#E5E7EB",
  textSecondary: "#9CA3AF",
  accentBlue: "#3B82F6",
  accentGreen: "#22C55E",
  accentYellow: "#FACC15",
  accentRed: "#EF4444",
  accentPurple: "#8B5CF6",
};

export default function RiskCentre() {
  const snapshot = usePortfolioSnapshotStore((s) => s.snapshot);

  // ======================
  // SAFE DERIVATIONS
  // ======================
  const totalValue = snapshot?.totalValue ?? 0;
  const holdings = snapshot?.holdings ?? [];

  const equityValue = holdings
    .filter((h) => h.assetClass === "equity")
    .reduce((sum, h) => sum + h.value, 0);

  const cryptoValue = holdings
    .filter((h) => h.assetClass === "crypto")
    .reduce((sum, h) => sum + h.value, 0);

  const equityExposure =
    totalValue > 0 ? (equityValue / totalValue) * 100 : 0;

  const cryptoExposure =
    totalValue > 0 ? (cryptoValue / totalValue) * 100 : 0;

  const largestHolding =
    holdings.length > 0
      ? [...holdings].sort((a, b) => b.value - a.value)[0]
      : { symbol: "N/A", value: 0 };

  const largestPct =
    totalValue > 0 ? (largestHolding.value / totalValue) * 100 : 0;

  // ======================
  // RISK POSTURE (UNCHANGED)
  // ======================
  let posture = "Moderate";
  let postureColor = COLORS.accentYellow;

  if (largestPct > 40) {
    posture = "Elevated";
    postureColor = COLORS.accentRed;
  }

  if (largestPct < 25 && equityExposure < 70) {
    posture = "Low";
    postureColor = COLORS.accentGreen;
  }

  // ======================
  // STRESS SCENARIOS
  // ======================
  const equityDrawdown20 = equityValue * 0.2;
  const cryptoDrawdown40 = cryptoValue * 0.4;
  const topHoldingShock30 = largestHolding.value * 0.3;

  // ======================
  // DONUT DATA
  // ======================
  const donutData = holdings
    .map((h) => ({
      symbol: h.symbol,
      pct: totalValue > 0 ? (h.value / totalValue) * 100 : 0,
    }))
    .sort((a, b) => b.pct - a.pct);

  const donutColors = [
    COLORS.accentBlue,
    COLORS.accentPurple,
    COLORS.accentGreen,
    COLORS.accentYellow,
    COLORS.accentRed,
  ];

  let cumulative = 0;

  // ======================
  // SINGLE RENDER (GUARDED)
  // ======================
  return (
    <div
      style={{
        padding: "32px",
        maxWidth: "1200px",
        margin: "0 auto",
        background: COLORS.bg,
        color: COLORS.textPrimary,
        minHeight: "100vh",
      }}
    >
      <h1 style={{ marginBottom: "24px" }}>Risk Centre</h1>

      {!snapshot || holdings.length === 0 ? (
        <p style={{ color: COLORS.textSecondary }}>
          Risk analytics unavailable – portfolio snapshot not yet loaded.
        </p>
      ) : (
        <>
          {/* SNAPSHOT META */}
          <div
            style={{
              background: COLORS.panel,
              border: `1px solid ${COLORS.border}`,
              borderRadius: "12px",
              padding: "20px",
              marginBottom: "24px",
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <p>
              <strong>Snapshot timestamp:</strong>{" "}
              <span style={{ color: COLORS.textSecondary }}>
                {snapshot.timestamp ?? "N/A"}
              </span>
            </p>
            <p>
              <strong>Total portfolio value:</strong>{" "}
              <span style={{ color: COLORS.accentBlue }}>
                ${totalValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </span>
            </p>
          </div>

          {/* GRID */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "24px",
            }}
          >
            {/* LEFT COLUMN */}
            <div>
              {/* RISK POSTURE */}
              <section
                style={{
                  background: COLORS.panelAlt,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: "12px",
                  padding: "24px",
                  marginBottom: "24px",
                }}
              >
                <h2>Risk Posture</h2>
                <p>
                  <strong>Overall posture:</strong>{" "}
                  <span style={{ color: postureColor }}>{posture}</span>
                </p>
                <ul>
                  <li>Elevated single-asset concentration.</li>
                  <li>Equity exposure dominates portfolio risk.</li>
                </ul>
              </section>

              {/* SUPPORT METRICS */}
              <section
                style={{
                  background: COLORS.panel,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: "12px",
                  padding: "24px",
                  marginBottom: "24px",
                }}
              >
                <h2>Posture Support Metrics</h2>
                <ul>
                  <li>
                    Largest position:{" "}
                    <strong>{largestHolding.symbol}</strong>{" "}
                    <span style={{ color: COLORS.textSecondary }}>
                      ({largestPct.toFixed(1)}%)
                    </span>
                  </li>
                  <li>
                    Equity exposure:{" "}
                    <strong>{equityExposure.toFixed(1)}%</strong>
                  </li>
                  <li>
                    Crypto exposure:{" "}
                    <strong>{cryptoExposure.toFixed(1)}%</strong>
                  </li>
                  <li>
                    Number of holdings:{" "}
                    <strong>{holdings.length}</strong>
                  </li>
                </ul>
              </section>

              {/* EXPOSURE DISTRIBUTION */}
              <section
                style={{
                  background: COLORS.panelAlt,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: "12px",
                  padding: "24px",
                }}
              >
                <h2>Exposure Distribution</h2>

                {/* Equity */}
                <div style={{ marginBottom: "16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Equity exposure</span>
                    <strong>{equityExposure.toFixed(1)}%</strong>
                  </div>
                  <div
                    style={{
                      height: "10px",
                      background: COLORS.border,
                      borderRadius: "6px",
                    }}
                  >
                    <div
                      style={{
                        width: `${equityExposure}%`,
                        height: "100%",
                        background: COLORS.accentBlue,
                        borderRadius: "6px",
                      }}
                    />
                  </div>
                </div>

                {/* Crypto */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Crypto exposure</span>
                    <strong>{cryptoExposure.toFixed(1)}%</strong>
                  </div>
                  <div
                    style={{
                      height: "10px",
                      background: COLORS.border,
                      borderRadius: "6px",
                    }}
                  >
                    <div
                      style={{
                        width: `${cryptoExposure}%`,
                        height: "100%",
                        background: COLORS.accentPurple,
                        borderRadius: "6px",
                      }}
                    />
                  </div>
                </div>
              </section>
            </div>

            {/* RIGHT COLUMN */}
            <div>
              {/* HOLDING CONCENTRATION DONUT */}
              <section
                style={{
                  background: COLORS.panel,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: "12px",
                  padding: "24px",
                  marginBottom: "24px",
                }}
              >
                <h2>Holding Concentration</h2>

                <svg width="220" height="220" viewBox="0 0 220 220">
                  <g transform="rotate(-90 110 110)">
                    {donutData.map((d, i) => {
                      const radius = 90;
                      const circumference = 2 * Math.PI * radius;
                      const dash = (d.pct / 100) * circumference;
                      const offset = circumference - dash - cumulative;
                      cumulative += dash;

                      return (
                        <circle
                          key={d.symbol}
                          cx="110"
                          cy="110"
                          r={radius}
                          fill="none"
                          stroke={donutColors[i % donutColors.length]}
                          strokeWidth="18"
                          strokeDasharray={`${dash} ${circumference}`}
                          strokeDashoffset={offset}
                        />
                      );
                    })}
                  </g>
                  <text
                    x="110"
                    y="105"
                    textAnchor="middle"
                    fill={COLORS.textPrimary}
                    fontSize="20"
                    fontWeight="600"
                  >
                    {largestHolding.symbol}
                  </text>
                  <text
                    x="110"
                    y="128"
                    textAnchor="middle"
                    fill={COLORS.textSecondary}
                    fontSize="14"
                  >
                    {largestPct.toFixed(1)}%
                  </text>
                </svg>

                <ul style={{ marginTop: "16px" }}>
                  {donutData.slice(0, 5).map((d, i) => (
                    <li key={d.symbol}>
                      <span style={{ color: donutColors[i % donutColors.length] }}>
                        ●
                      </span>{" "}
                      {d.symbol}: {d.pct.toFixed(1)}%
                    </li>
                  ))}
                </ul>
              </section>

              {/* STRESS SCENARIOS */}
              <section
                style={{
                  background: COLORS.panelAlt,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: "12px",
                  padding: "24px",
                }}
              >
                <h2>Stress Scenarios</h2>
                <ul>
                  <li>
                    Equity drawdown (-20%):{" "}
                    <span style={{ color: COLORS.accentRed }}>
                      -$
                      {equityDrawdown20.toLocaleString(undefined, {
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </li>
                  <li>
                    Crypto drawdown (-40%):{" "}
                    <span style={{ color: COLORS.accentRed }}>
                      -$
                      {cryptoDrawdown40.toLocaleString(undefined, {
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </li>
                  <li>
                    Top holding shock (-30% on {largestHolding.symbol}):{" "}
                    <span style={{ color: COLORS.accentRed }}>
                      -$
                      {topHoldingShock30.toLocaleString(undefined, {
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </li>
                </ul>
              </section>
            </div>
          </div>

          <p
            style={{
              marginTop: "24px",
              fontSize: "13px",
              color: COLORS.textSecondary,
            }}
          >
            Deterministic, snapshot-derived. Non-predictive.
          </p>
        </>
      )}
    </div>
  );
}

