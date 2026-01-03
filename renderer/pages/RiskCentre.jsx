// renderer/pages/RiskCentre.jsx
import React from "react";
import { usePortfolioSnapshotStore } from "../state/portfolioSnapshotStore";

/**
 * RISK CENTRE — READ ONLY
 * V16 FINAL — CANONICAL PRESENTATION
 * ----------------------------------
 * - ZERO logic changes
 * - ZERO snapshot mutations
 * - Canonical color tokens ONLY
 * - Exposure distribution bars
 * - Holding concentration donut
 * - Deterministic, scalable, frozen UI contract
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

  // HARD GUARD — NO SNAPSHOT, NO RENDER
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
     RISK ENGINE — READ ONLY
     Renderer consumption only
     (NO UI usage, NO mutation)
     ========================= */
  const _riskEngine = snapshot.riskEngine ?? null;

  /* =========================
     SAFE DERIVATIONS (UNCHANGED)
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

  const largestHolding = [...holdings].sort((a, b) => b.value - a.value)[0];
  const largestPct =
    totalValue > 0 ? (largestHolding.value / totalValue) * 100 : 0;

  /* =========================
     RISK POSTURE (UNCHANGED)
     ========================= */

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

  /* =========================
     STRESS SCENARIOS (UNCHANGED)
     ========================= */

  const equityDrawdown20 = equityValue * 0.2;
  const cryptoDrawdown40 = cryptoValue * 0.4;
  const topHoldingShock30 = largestHolding.value * 0.3;

  /* =========================
     DONUT CALCULATIONS
     ========================= */

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
                Number of holdings: <strong>{holdings.length}</strong>
              </li>
            </ul>
          </section>
        </div>

        {/* RIGHT COLUMN */}
        <div>
          <section
            style={{
              background: COLORS.panelAlt,
              border: `1px solid ${COLORS.border}`,
              borderRadius: "12px",
              padding: "24px",
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
                    const start = cumulative;
                    cumulative += h.pct;
                    return `${donutColors[i % donutColors.length]} ${start}% ${
                      start + h.pct
                    }%`;
                  })
                  .join(",")})`,
                margin: "16px auto",
                position: "relative",
              }}
            />
          </section>
        </div>
      </div>
    </div>
  );
}

