import React, { useEffect, useState } from "react";
import { usePortfolioSnapshotStore } from "../state/portfolioSnapshotStore";
import { buildRiskCentre } from "../engine/riskCentreEngine";

/**
 * RISK CENTRE — READ ONLY
 * V8 — UX ENHANCEMENTS (TOOLTIPS ONLY)
 * ------------------------------------------------
 * - V7 logic preserved 100%
 * - No UI removed
 * - No calculations changed
 * - Tooltips are additive only
 * - Deterministic, renderer-safe
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

  /* =========================
     V7 — AUTHORITATIVE VALUATION
     ========================= */
  const [valuation, setValuation] = useState(null);

  useEffect(() => {
    let alive = true;

    async function loadValuation() {
      if (!window.jupiter?.invoke) return;
      const v = await window.jupiter.invoke("portfolio:getValuation");
      if (alive) setValuation(v);
    }

    loadValuation();
    return () => {
      alive = false;
    };
  }, []);

  /* =========================
     ENGINE BUILD (INTELLIGENCE ONLY)
     ========================= */
  const riskCentreIntelligence =
    snapshot && valuation
      ? buildRiskCentre({ portfolioSnapshot: snapshot })
      : null;

  if (!snapshot || !valuation) {
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
          Risk analytics unavailable — portfolio valuation not yet loaded.
        </p>
      </div>
    );
  }

  /* =========================
     V7 — SINGLE SOURCE OF TRUTH
     ========================= */

  const totalValue = valuation.totals.liveValue;
  const positions = valuation.positions;

  const equityPositions = positions.filter(
    (p) => p.assetClass === "equity"
  );
  const cryptoPositions = positions.filter(
    (p) => p.assetClass === "crypto"
  );

  const equityValue = equityPositions.reduce(
    (s, p) => s + p.liveValue,
    0
  );
  const cryptoValue = cryptoPositions.reduce(
    (s, p) => s + p.liveValue,
    0
  );

  const equityExposure =
    totalValue > 0 ? (equityValue / totalValue) * 100 : 0;
  const cryptoExposure =
    totalValue > 0 ? (cryptoValue / totalValue) * 100 : 0;

  const sortedHoldings = [...positions].sort(
    (a, b) => b.liveValue - a.liveValue
  );

  const largestHolding = sortedHoldings[0];
  const largestPct =
    totalValue > 0 ? (largestHolding.liveValue / totalValue) * 100 : 0;

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
  const topHoldingShock30 = largestHolding.liveValue * 0.3;

  const donutData = sortedHoldings.map((h) => ({
    symbol: h.symbol,
    pct: totalValue > 0 ? (h.liveValue / totalValue) * 100 : 0,
  }));

  const donutColors = [
    COLORS.accentBlue,
    COLORS.accentPurple,
    COLORS.accentGreen,
    COLORS.accentYellow,
    COLORS.accentRed,
  ];

  /* =========================
     UI — FROZEN CONTRACT (V8 TOOLTIP ADDITIONS)
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
        <p title="Timestamp of the latest portfolio snapshot used for risk calculations">
          <strong>Snapshot timestamp:</strong>{" "}
          <span style={{ color: COLORS.textSecondary }}>
            {snapshot.timestamp ?? "N/A"}
          </span>
        </p>
        <p title="Live portfolio market value sourced from the Portfolio Valuation engine">
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
            <h2 title="Overall portfolio risk assessment based on concentration and exposure">
              Risk Posture
            </h2>
            <p>
              <strong>Overall posture:</strong>{" "}
              <span
                style={{ color: postureColor }}
                title="Derived from largest position concentration and asset class balance"
              >
                {posture}
              </span>
            </p>
            <ul>
              <li title="Measures dependency on a single asset">
                Elevated single-asset concentration.
              </li>
              <li title="Equity exposure relative to total portfolio value">
                Equity exposure dominates portfolio risk.
              </li>
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
            <h2 title="Supporting metrics used to justify the current risk posture">
              Posture Support Metrics
            </h2>
            <ul>
              <li title="Largest position as a percentage of total portfolio value">
                Largest position: <strong>{largestHolding.symbol}</strong>{" "}
                <span style={{ color: COLORS.textSecondary }}>
                  ({largestPct.toFixed(1)}%)
                </span>
              </li>
              <li title="Percentage of portfolio allocated to equities">
                Equity exposure:{" "}
                <strong>{equityExposure.toFixed(1)}%</strong>
              </li>
              <li title="Percentage of portfolio allocated to crypto assets">
                Crypto exposure:{" "}
                <strong>{cryptoExposure.toFixed(1)}%</strong>
              </li>
              <li title="Total number of distinct holdings in the portfolio">
                Number of holdings:{" "}
                <strong>{positions.length}</strong>
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
            <h2 title="Visual representation of portfolio concentration by holding">
              Holding Concentration
            </h2>

            <div
              title="Each segment represents a holding's percentage of total portfolio value"
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
                  textAlign: "center",
                }}
                title="Largest holding by portfolio weight"
              >
                {largestHolding.symbol}
                <br />
                {largestPct.toFixed(1)}%
              </div>
            </div>

            <ul>
              {donutData.slice(0, 5).map((h, i) => (
                <li
                  key={h.symbol}
                  title={`${h.symbol} represents ${h.pct.toFixed(
                    1
                  )}% of total portfolio value`}
                >
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
          <h2 title="Portfolio allocation by asset class">
            Exposure Distribution
          </h2>

          <div style={{ marginBottom: "16px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "6px",
              }}
            >
              <span title="Percentage of portfolio invested in equities">
                Equity exposure
              </span>
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
              <span title="Percentage of portfolio invested in crypto assets">
                Crypto exposure
              </span>
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
          <h2 title="Hypothetical stress scenarios applied to current portfolio">
            Stress Scenarios
          </h2>
          <ul>
            <li title="Impact if equity holdings decline by 20%">
              Equity drawdown (-20%):{" "}
              <span style={{ color: COLORS.accentRed }}>
                -$
                {equityDrawdown20.toLocaleString(undefined, {
                  maximumFractionDigits: 0,
                })}
              </span>
            </li>
            <li title="Impact if crypto holdings decline by 40%">
              Crypto drawdown (-40%):{" "}
              <span style={{ color: COLORS.accentRed }}>
                -$
                {cryptoDrawdown40.toLocaleString(undefined, {
                  maximumFractionDigits: 0,
                })}
              </span>
            </li>
            <li title="Impact if the largest holding declines by 30%">
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
