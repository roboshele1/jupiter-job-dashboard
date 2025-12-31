// renderer/pages/RiskCentre.jsx
import React from "react";
import { usePortfolioSnapshotStore } from "../state/portfolioSnapshotStore";

/**
 * RISK CENTRE — READ ONLY
 * V1 — PHASE A + PHASE B (UNDER-THE-HOOD)
 * ------------------------------------------------
 * - ZERO snapshot mutation
 * - ZERO UI change
 * - Deterministic derivations only
 * - Phase B adds riskProfile object (not rendered)
 */

/** CANONICAL COLOR TOKENS */
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

  if (!snapshot || !snapshot.holdings || snapshot.holdings.length === 0) {
    return (
      <div
        style={{
          padding: "32px",
          background: COLORS.bg,
          color: COLORS.textPrimary,
          minHeight: "100vh",
        }}
      >
        <h1>Risk Centre</h1>
        <p style={{ color: COLORS.textSecondary }}>
          Risk analytics unavailable — portfolio snapshot not yet loaded.
        </p>
      </div>
    );
  }

  /* =========================
     PHASE A — SAFE DERIVATIONS
     ========================= */

  const totalValue = snapshot.totalValue ?? 0;
  const holdings = snapshot.holdings;

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

  const sortedHoldings = [...holdings].sort(
    (a, b) => b.value - a.value
  );

  const largestHolding = sortedHoldings[0];
  const largestPct =
    totalValue > 0 ? (largestHolding.value / totalValue) * 100 : 0;

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

  const equityDrawdown20 = equityValue * 0.2;
  const cryptoDrawdown40 = cryptoValue * 0.4;
  const topHoldingShock30 = largestHolding.value * 0.3;

  const donutData = sortedHoldings.map((h) => ({
    symbol: h.symbol,
    pct: totalValue > 0 ? (h.value / totalValue) * 100 : 0,
  }));

  const donutColors = [
    COLORS.accentBlue,
    COLORS.accentPurple,
    COLORS.accentGreen,
    COLORS.accentYellow,
    COLORS.accentRed,
  ];

  /* =========================
     PHASE B — STEP 1
     RISK PROFILE (INTERNAL)
     ========================= */

  const top1Pct = donutData[0]?.pct ?? 0;
  const top3Pct = donutData
    .slice(0, 3)
    .reduce((s, h) => s + h.pct, 0);
  const top5Pct = donutData
    .slice(0, 5)
    .reduce((s, h) => s + h.pct, 0);

  const longTailPct = Math.max(0, 100 - top5Pct);
  const equityVsCryptoGap = Math.abs(
    equityExposure - cryptoExposure
  );

  const diversificationScore = Math.max(
    0,
    Math.min(100, longTailPct)
  );

  const riskProfile = {
    metrics: {
      top1Pct,
      top3Pct,
      top5Pct,
      longTailPct,
      equityVsCryptoGap,
      diversificationScore,
    },
    flags: {
      isSingleNameRisk: top1Pct >= 35,
      isConcentrationRisk: top3Pct >= 65,
      isEquityHeavy: equityExposure >= 70,
      isCryptoHeavy: cryptoExposure >= 40,
      isUnderDiversified: diversificationScore < 25,
    },
  };

  /* =========================
     UI — FROZEN CONTRACT
     ========================= */

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
            $
            {totalValue.toLocaleString(undefined, {
              maximumFractionDigits: 2,
            })}
          </span>
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "24px",
        }}
      >
        <div>
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

          <section
            style={{
              background: COLORS.panel,
              border: `1px solid ${COLORS.border}`,
              borderRadius: "12px",
              padding: "24px",
            }}
          >
            <h2>Posture Support Metrics</h2>
            <ul>
              <li>
                Largest position: <strong>{largestHolding.symbol}</strong>{" "}
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
        </div>

        <div>
          <section
            style={{
              background: COLORS.panelAlt,
              border: `1px solid ${COLORS.border}`,
              borderRadius: "12px",
              padding: "24px",
              marginBottom: "24px",
            }}
          >
            <h2>Holding Concentration</h2>

            <div
              style={{
                width: "200px",
                height: "200px",
                borderRadius: "50%",
                background: `conic-gradient(${donutData
                  .map((h, i) => {
                    const start = donutData
                      .slice(0, i)
                      .reduce((s, x) => s + x.pct, 0);
                    return `${donutColors[i % donutColors.length]} ${start}% ${
                      start + h.pct
                    }%`;
                  })
                  .join(",")})`,
                margin: "16px auto",
                position: "relative",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: "40px",
                  background: COLORS.panelAlt,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "bold",
                }}
              >
                {largestHolding.symbol}
                <br />
                {largestPct.toFixed(1)}%
              </div>
            </div>

            <ul>
              {donutData.slice(0, 5).map((h, i) => (
                <li key={h.symbol}>
                  <span
                    style={{
                      display: "inline-block",
                      width: "10px",
                      height: "10px",
                      borderRadius: "50%",
                      background: donutColors[i % donutColors.length],
                      marginRight: "8px",
                    }}
                  />
                  {h.symbol}: {h.pct.toFixed(1)}%
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "24px",
          marginTop: "24px",
        }}
      >
        <section
          style={{
            background: COLORS.panel,
            border: `1px solid ${COLORS.border}`,
            borderRadius: "12px",
            padding: "24px",
          }}
        >
          <h2>Exposure Distribution</h2>

          <div style={{ marginBottom: "16px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "6px",
              }}
            >
              <span>Equity exposure</span>
              <strong>{equityExposure.toFixed(1)}%</strong>
            </div>
            <div
              style={{
                height: "8px",
                background: COLORS.border,
                borderRadius: "4px",
              }}
            >
              <div
                style={{
                  width: `${equityExposure}%`,
                  height: "100%",
                  background: COLORS.accentBlue,
                  borderRadius: "4px",
                }}
              />
            </div>
          </div>

          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "6px",
              }}
            >
              <span>Crypto exposure</span>
              <strong>{cryptoExposure.toFixed(1)}%</strong>
            </div>
            <div
              style={{
                height: "8px",
                background: COLORS.border,
                borderRadius: "4px",
              }}
            >
              <div
                style={{
                  width: `${cryptoExposure}%`,
                  height: "100%",
                  background: COLORS.accentPurple,
                  borderRadius: "4px",
                }}
              />
            </div>
          </div>
        </section>

        <section
          style={{
            background: COLORS.panel,
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
                  maximumFractionDigits: 0,
                })}
              </span>
            </li>
            <li>
              Crypto drawdown (-40%):{" "}
              <span style={{ color: COLORS.accentRed }}>
                -$
                {cryptoDrawdown40.toLocaleString(undefined, {
                  maximumFractionDigits: 0,
                })}
              </span>
            </li>
            <li>
              Top holding shock (-30% on {largestHolding.symbol}):{" "}
              <span style={{ color: COLORS.accentRed }}>
                -$
                {topHoldingShock30.toLocaleString(undefined, {
                  maximumFractionDigits: 0,
                })}
              </span>
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}

