import React from "react";

export default function RiskCentre() {
  const snapshotTime = "12/28/2025, 12:00:22 AM";

  // Deterministic snapshot values (already validated in prior phases)
  const exposure = {
    equity: 66.7,
    crypto: 33.3
  };

  const concentration = {
    top1: 66.7
  };

  const stressScenarios = [
    { label: "Equity −20%", impact: -13.3 },
    { label: "Crypto −30%", impact: -10.0 },
    { label: "Equity −20% + Crypto −30%", impact: -23.3 },
    { label: "Macro Shock (−15%)", impact: -15.0 }
  ];

  const breaches = [
    "Single-position concentration — HIGH",
    "Crypto exposure — ELEVATED"
  ];

  const regime = "Concentration + Volatility Driven";

  const recommendations = [
    {
      title: "Concentration Risk Awareness",
      text:
        "Portfolio risk is dominated by a single large position. Consider whether current concentration aligns with long-term risk tolerance under adverse market conditions."
    },
    {
      title: "Crypto Volatility Sensitivity",
      text:
        "Crypto exposure materially increases downside sensitivity in stress environments. Portfolio drawdowns may accelerate during correlated equity-crypto selloffs."
    },
    {
      title: "Stress Scenario Preparedness",
      text:
        "Combined equity and crypto stress scenarios indicate elevated potential drawdowns. Liquidity planning and drawdown tolerance should be reviewed accordingly."
    },
    {
      title: "Regime Alignment Check",
      text:
        "Current risk regime reflects concentration-driven volatility rather than diversified market exposure. Future risk changes will be primarily position-specific."
    }
  ];

  return (
    <div className="risk-centre">
      <h1>Risk Centre</h1>

      <p className="muted">
        Mode: Read-only · Deterministic · Intelligence-only
      </p>
      <p className="muted">Snapshot as of {snapshotTime}</p>

      <hr />

      <section>
        <h2>Exposure</h2>
        <p>Equity: {exposure.equity}%</p>
        <p>Crypto: {exposure.crypto}%</p>
      </section>

      <section>
        <h2>Concentration</h2>
        <p>Top 1 Position: {concentration.top1}%</p>
      </section>

      <section>
        <h2>Forward Stress Scenarios</h2>
        {stressScenarios.map((s, i) => (
          <p key={i}>
            {s.label}: {s.impact}%
          </p>
        ))}
      </section>

      <section>
        <h2>Risk Threshold Breaches</h2>
        <ul>
          {breaches.map((b, i) => (
            <li key={i}>{b}</li>
          ))}
        </ul>
      </section>

      <section>
        <h2>Risk Regime</h2>
        <p>{regime}</p>
      </section>

      <hr />

      <section>
        <h2>Risk Recommendations</h2>
        <p className="muted">
          Interpretive guidance only — not actions or instructions.
        </p>
        <ul>
          {recommendations.map((r, i) => (
            <li key={i}>
              <strong>{r.title}:</strong> {r.text}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

