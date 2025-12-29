import React from "react";
import { usePortfolioSnapshotStore } from "../state/portfolioSnapshotStore";

/**
 * RISK CENTRE — READ ONLY
 * V15-A: Snapshot Guard + Safe Render
 * V15-B: Presentation-only visuals
 */

export default function RiskCentre() {
  const snapshot = usePortfolioSnapshotStore((s) => s.snapshot);

  /**
   * HARD GUARD
   */
  if (!snapshot || !snapshot.holdings || snapshot.holdings.length === 0) {
    return (
      <div style={{ padding: "32px" }}>
        <h1>Risk Centre</h1>
        <p style={{ opacity: 0.7 }}>
          Risk analytics unavailable — portfolio snapshot not yet loaded.
        </p>
      </div>
    );
  }

  /**
   * SAFE DERIVATIONS (UNCHANGED)
   */
  const totalValue = snapshot.totalValue ?? 0;
  const holdings = snapshot.holdings;

  const equityValue = holdings
    .filter((h) => h.assetClass === "equity")
    .reduce((sum, h) => sum + h.value, 0);

  const cryptoValue = holdings
    .filter((h) => h.assetClass === "crypto")
    .reduce((sum, h) => sum + h.value, 0);

  const equityExposure = totalValue > 0 ? (equityValue / totalValue) * 100 : 0;
  const cryptoExposure = totalValue > 0 ? (cryptoValue / totalValue) * 100 : 0;

  const sortedHoldings = [...holdings].sort((a, b) => b.value - a.value);
  const largestHolding = sortedHoldings[0];
  const largestPct =
    totalValue > 0 ? (largestHolding.value / totalValue) * 100 : 0;

  /**
   * RISK POSTURE (UNCHANGED)
   */
  let posture = "Moderate";
  if (largestPct > 40) posture = "Elevated";
  if (largestPct < 25 && equityExposure < 70) posture = "Low";

  const postureColor =
    posture === "Low"
      ? "#43aa8b"
      : posture === "Elevated"
      ? "#f94144"
      : "#f9c74f";

  /**
   * STRESS SCENARIOS (UNCHANGED)
   */
  const equityDrawdown20 = equityValue * 0.2;
  const cryptoDrawdown40 = cryptoValue * 0.4;
  const topHoldingShock30 = largestHolding.value * 0.3;

  const stressScenarios = [
    {
      label: "Equity Drawdown (-20%)",
      impact: equityDrawdown20,
      color: "#f94144",
    },
    {
      label: "Crypto Drawdown (-40%)",
      impact: cryptoDrawdown40,
      color: "#f9c74f",
    },
    {
      label: `Top Holding Shock (-30% on ${largestHolding.symbol})`,
      impact: topHoldingShock30,
      color: "#f3722c",
    },
  ];

  const cardStyle = {
    background: "rgba(255,255,255,0.03)",
    borderRadius: "14px",
    padding: "20px",
    marginBottom: "28px",
  };

  return (
    <div style={{ padding: "32px", maxWidth: "960px" }}>
      <h1>Risk Centre</h1>

      <p>
        <strong>Snapshot timestamp:</strong>{" "}
        {snapshot.timestamp ?? "N/A"}
      </p>
      <p>
        <strong>Total portfolio value:</strong>{" "}
        ${totalValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
      </p>

      {/* ================= RISK POSTURE ================= */}
      <section style={cardStyle}>
        <h2>Risk Posture</h2>

        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            padding: "8px 16px",
            borderRadius: "999px",
            background: postureColor,
            color: "#0b0d17",
            fontWeight: 700,
            fontSize: "13px",
            marginBottom: "12px",
          }}
        >
          {posture.toUpperCase()} RISK
        </div>

        <ul>
          <li>Equity exposure dominates portfolio risk.</li>
          <li>Single-asset concentration is a key driver.</li>
        </ul>
      </section>

      {/* ============ SUPPORT METRICS ============ */}
      <section style={cardStyle}>
        <h2>Posture Support Metrics</h2>
        <ul>
          <li>
            <strong>Largest position:</strong>{" "}
            {largestHolding.symbol} — {largestPct.toFixed(1)}%
          </li>
          <li>
            <strong>Equity exposure:</strong>{" "}
            {equityExposure.toFixed(1)}%
          </li>
          <li>
            <strong>Crypto exposure:</strong>{" "}
            {cryptoExposure.toFixed(1)}%
          </li>
          <li>
            <strong>Number of holdings:</strong>{" "}
            {holdings.length}
          </li>
        </ul>
      </section>

      {/* ============ EXPOSURE DISTRIBUTION ============ */}
      <section style={cardStyle}>
        <h2>Exposure Distribution</h2>

        <div
          style={{
            display: "flex",
            height: "28px",
            borderRadius: "10px",
            overflow: "hidden",
            background: "#1e1e2f",
            marginTop: "12px",
          }}
        >
          <div
            style={{
              width: `${equityExposure}%`,
              background: "#4cc9f0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "12px",
              fontWeight: 600,
              color: "#0b0d17",
            }}
          >
            Equity {equityExposure.toFixed(1)}%
          </div>

          <div
            style={{
              width: `${cryptoExposure}%`,
              background: "#f9c74f",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "12px",
              fontWeight: 600,
              color: "#0b0d17",
            }}
          >
            Crypto {cryptoExposure.toFixed(1)}%
          </div>
        </div>
      </section>

      {/* ============ HOLDING CONCENTRATION ============ */}
      <section style={cardStyle}>
        <h2>Holding Concentration</h2>

        {sortedHoldings.map((h) => {
          const pct =
            totalValue > 0 ? (h.value / totalValue) * 100 : 0;

          return (
            <div key={h.symbol} style={{ marginBottom: "12px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "13px",
                  marginBottom: "4px",
                }}
              >
                <span>{h.symbol}</span>
                <span>{pct.toFixed(1)}%</span>
              </div>

              <div
                style={{
                  height: "10px",
                  borderRadius: "6px",
                  background: "#1e1e2f",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${pct}%`,
                    height: "100%",
                    background:
                      h.symbol === largestHolding.symbol
                        ? "#f94144"
                        : "#4cc9f0",
                  }}
                />
              </div>
            </div>
          );
        })}
      </section>

      {/* ============ STRESS SCENARIO VISUALS ============ */}
      <section style={cardStyle}>
        <h2>Stress Scenario Impact</h2>

        {stressScenarios.map((s) => {
          const pct = totalValue > 0 ? (s.impact / totalValue) * 100 : 0;

          return (
            <div key={s.label} style={{ marginBottom: "14px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "13px",
                  marginBottom: "4px",
                }}
              >
                <span>{s.label}</span>
                <span>-{pct.toFixed(1)}%</span>
              </div>

              <div
                style={{
                  height: "10px",
                  borderRadius: "6px",
                  background: "#1e1e2f",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${pct}%`,
                    height: "100%",
                    background: s.color,
                  }}
                />
              </div>
            </div>
          );
        })}
      </section>

      {/* ============ NARRATIVE ============ */}
      <section style={cardStyle}>
        <h2>Risk Narrative</h2>
        <p>
          The portfolio currently exhibits a{" "}
          <strong>{posture.toLowerCase()}</strong> overall risk posture,
          driven primarily by equity concentration rather than leverage
          or excessive asset-class breadth.
        </p>
        <p>
          Stress scenarios indicate that broad equity market weakness
          would have a larger impact on portfolio value than isolated
          crypto volatility. Concentration risk is therefore the primary
          structural risk factor at this stage.
        </p>
      </section>
    </div>
  );
}

