import React from "react";
import { usePortfolioSnapshotStore } from "../state/portfolioSnapshotStore";

export default function RiskCentre() {
  const snapshot = usePortfolioSnapshotStore(s => s.snapshot);

  if (!snapshot || !snapshot.holdings || snapshot.holdings.length === 0) {
    return (
      <div style={{ padding: "2rem" }}>
        <h1>Risk Centre</h1>
        <p>Mode: Read-only · Deterministic · Intelligence-only</p>
        <p>No snapshot holdings found.</p>
      </div>
    );
  }

  const totalValue = snapshot.totalValue;

  const holdings = snapshot.holdings.map(h => ({
    symbol: h.symbol,
    value: h.value,
    weight: totalValue > 0 ? (h.value / totalValue) * 100 : 0
  }));

  /* ---------------------------
     Exposure
  ---------------------------- */
  const equitySymbols = ["NVDA", "AVGO", "ASML", "HOOD", "MSTR", "BMNR", "APLD"];
  const cryptoSymbols = ["BTC", "ETH"];

  const equityExposure = holdings
    .filter(h => equitySymbols.includes(h.symbol))
    .reduce((sum, h) => sum + h.weight, 0);

  const cryptoExposure = holdings
    .filter(h => cryptoSymbols.includes(h.symbol))
    .reduce((sum, h) => sum + h.weight, 0);

  /* ---------------------------
     Concentration
  ---------------------------- */
  const sortedByWeight = [...holdings].sort((a, b) => b.weight - a.weight);
  const topPosition = sortedByWeight[0];

  /* ---------------------------
     Stress Scenarios
  ---------------------------- */
  const stressScenarios = [
    { label: "Equity -10%", impact: -0.10 * equityExposure },
    { label: "Equity -20%", impact: -0.20 * equityExposure },
    { label: "Crypto -20%", impact: -0.20 * cryptoExposure },
    { label: "Crypto -40%", impact: -0.40 * cryptoExposure },
    {
      label: "Equity -20% + Crypto -30%",
      impact: -0.20 * equityExposure - 0.30 * cryptoExposure
    }
  ];

  /* ---------------------------
     Risk Scores (V9 Step 1)
  ---------------------------- */
  const baseRiskScores = {
    BTC: 45,
    ETH: 25,
    NVDA: 15,
    ASML: 15,
    AVGO: 40,
    MSTR: 5,
    HOOD: 15,
    BMNR: 5,
    APLD: 5
  };

  const scoredAssets = holdings.map(h => ({
    ...h,
    riskScore: baseRiskScores[h.symbol] ?? 0
  }));

  /* ---------------------------
     V9 STEP 2 — Risk Bands
  ---------------------------- */
  function riskBand(score) {
    if (score >= 41) return "Critical";
    if (score >= 26) return "High";
    if (score >= 11) return "Moderate";
    return "Low";
  }

  const assetsWithBands = scoredAssets.map(a => ({
    ...a,
    band: riskBand(a.riskScore)
  }));

  /* ---------------------------
     Portfolio Risk Severity
  ---------------------------- */
  const bandCounts = assetsWithBands.reduce(
    (acc, a) => {
      acc[a.band] += 1;
      return acc;
    },
    { Low: 0, Moderate: 0, High: 0, Critical: 0 }
  );

  let portfolioSeverity = "LOW";
  if (bandCounts.Critical >= 1) portfolioSeverity = "CRITICAL";
  else if (bandCounts.High >= 2) portfolioSeverity = "HIGH";
  else if (bandCounts.Moderate >= 1) portfolioSeverity = "MODERATE";

  /* ---------------------------
     Render
  ---------------------------- */
  return (
    <div style={{ padding: "2rem", maxWidth: "900px" }}>
      <h1>Risk Centre</h1>
      <p>Mode: Read-only · Deterministic · Intelligence-only</p>
      <p>
        Snapshot as of:{" "}
        {new Date(snapshot.timestamp).toLocaleString()}
      </p>

      <hr />

      <h2>Total Value</h2>
      <p>CA${totalValue.toFixed(2)}</p>

      <h2>Exposure</h2>
      <p>Equity: {equityExposure.toFixed(1)}%</p>
      <p>Crypto: {cryptoExposure.toFixed(1)}%</p>

      <h2>Concentration</h2>
      <p>
        Top position: {topPosition.symbol} —{" "}
        {topPosition.weight.toFixed(1)}%
      </p>

      <h2>Risk Decomposition — By Asset</h2>
      <ul>
        {assetsWithBands.map(a => (
          <li key={a.symbol}>
            {a.symbol} — {a.weight.toFixed(1)}%
          </li>
        ))}
      </ul>

      <h2>Stress Scenarios</h2>
      <ul>
        {stressScenarios.map(s => (
          <li key={s.label}>
            {s.label}: {(s.impact).toFixed(1)}% (
            {Math.round((s.impact / 100) * totalValue)})
          </li>
        ))}
      </ul>

      <h2>Risk Threshold Breaches</h2>
      <ul>
        {topPosition.weight > 25 && (
          <li>High concentration: {topPosition.symbol} at {topPosition.weight.toFixed(1)}%</li>
        )}
        {portfolioSeverity === "CRITICAL" || portfolioSeverity === "HIGH" ? (
          <li>Elevated portfolio risk detected</li>
        ) : (
          <li>None</li>
        )}
      </ul>

      <h2>Risk Scores — Per Asset (V9)</h2>
      <table>
        <thead>
          <tr>
            <th align="left">Asset</th>
            <th align="right">Weight %</th>
            <th align="right">Risk Score</th>
            <th align="left">Risk Band</th>
          </tr>
        </thead>
        <tbody>
          {assetsWithBands.map(a => (
            <tr key={a.symbol}>
              <td>{a.symbol}</td>
              <td align="right">{a.weight.toFixed(1)}</td>
              <td align="right">{a.riskScore}</td>
              <td>{a.band}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Overall Portfolio Risk</h2>
      <p><strong>{portfolioSeverity}</strong></p>
    </div>
  );
}

