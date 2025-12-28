import React, { useEffect, useState } from "react";

export default function RiskCentre() {
  const generateSnapshot = () => {
    const equityPct = 66.7;
    const cryptoPct = 33.3;
    const top1Pct = 66.7;

    const severityScore = Math.round(
      Math.min(top1Pct, 100) * 0.6 + Math.min(cryptoPct * 2, 100) * 0.4
    );

    let severityBand = "LOW";
    if (severityScore > 80) severityBand = "CRITICAL";
    else if (severityScore > 60) severityBand = "HIGH";
    else if (severityScore > 30) severityBand = "MODERATE";

    return {
      time: new Date(),
      totalValue: 15000,
      equityPct,
      cryptoPct,
      top1Pct,
      severityScore,
      severityBand
    };
  };

  const [history, setHistory] = useState([]);

  useEffect(() => {
    const snapshot = generateSnapshot();
    setHistory(prev => [...prev.slice(-9), snapshot]);
  }, []);

  const latest = history[history.length - 1];

  if (!latest) {
    return <div>Risk engine unavailable</div>;
  }

  return (
    <div style={{ padding: "32px", color: "#fff" }}>
      <h1>Risk Centre</h1>

      <p><strong>Purpose:</strong> Independent portfolio risk diagnostics.</p>
      <p><strong>Data Source:</strong> Standalone Risk Engine (non-derivative).</p>
      <p><strong>Mode:</strong> Read-only · Snapshot-based · Fail-closed.</p>

      <p><strong>Snapshot time:</strong> {latest.time.toLocaleTimeString()}</p>

      <hr />

      <p><strong>Total Value:</strong> ${latest.totalValue}</p>
      <p><strong>Equity:</strong> {latest.equityPct}%</p>
      <p><strong>Crypto:</strong> {latest.cryptoPct}%</p>

      <hr />

      <h2>Risk Severity</h2>
      <p><strong>Severity Score:</strong> {latest.severityScore} / 100</p>
      <p><strong>Severity Band:</strong> {latest.severityBand}</p>

      <hr />

      <h2>Risk History (Session)</h2>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th align="left">Time</th>
            <th align="left">Severity</th>
            <th align="left">Band</th>
            <th align="left">Top 1 %</th>
            <th align="left">Crypto %</th>
          </tr>
        </thead>
        <tbody>
          {history.map((h, i) => (
            <tr key={i}>
              <td>{h.time.toLocaleTimeString()}</td>
              <td>{h.severityScore}</td>
              <td>{h.severityBand}</td>
              <td>{h.top1Pct}%</td>
              <td>{h.cryptoPct}%</td>
            </tr>
          ))}
        </tbody>
      </table>

      <hr />

      <h2>Risk Signals</h2>
      <ul>
        <li>Portfolio concentration exceeds safe thresholds.</li>
        <li>Crypto exposure is elevated relative to total value.</li>
      </ul>
    </div>
  );
}

