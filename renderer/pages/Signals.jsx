import React from "react";

const READ_ONLY_SIGNALS_SNAPSHOT = {
  timestamp: new Date().toISOString(),
  signals: [
    {
      symbol: "BTC",
      assetClass: "crypto",
      momentum: "Strong",
      meanReversion: "Overextended",
      portfolioImpact: "High",
      delta: "↑"
    },
    {
      symbol: "ETH",
      assetClass: "crypto",
      momentum: "Weak",
      meanReversion: "Oversold",
      portfolioImpact: "Moderate",
      delta: "↓"
    },
    {
      symbol: "NVDA",
      assetClass: "equity",
      momentum: "Neutral",
      meanReversion: "Neutral",
      portfolioImpact: "Low",
      delta: "→"
    }
  ]
};

export default function Signals() {
  const { signals, timestamp } = READ_ONLY_SIGNALS_SNAPSHOT;

  return (
    <div style={{ padding: "24px" }}>
      <h1>Signals</h1>

      <div style={{ marginBottom: "16px", opacity: 0.8 }}>
        <strong>How to read this table:</strong>
        <ul>
          <li><strong>Momentum:</strong> Directional strength of recent price movement.</li>
          <li><strong>Mean Reversion:</strong> Distance from recent average price.</li>
          <li><strong>Portfolio Impact:</strong> Estimated influence on portfolio outcomes.</li>
          <li><strong>Δ:</strong> Change since last snapshot.</li>
        </ul>
      </div>

      <table width="100%" cellPadding="8" style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: "1px solid #333" }}>
            <th align="left">Symbol</th>
            <th align="left">Asset Class</th>
            <th align="left">Momentum</th>
            <th align="left">Mean Reversion</th>
            <th align="left">Portfolio Impact</th>
            <th align="left">Δ</th>
          </tr>
        </thead>
        <tbody>
          {signals.map((s) => (
            <tr key={s.symbol} style={{ borderBottom: "1px solid #222" }}>
              <td>{s.symbol}</td>
              <td>{s.assetClass}</td>
              <td>{s.momentum}</td>
              <td>{s.meanReversion}</td>
              <td>{s.portfolioImpact}</td>
              <td>{s.delta}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ marginTop: "12px", opacity: 0.6 }}>
        Snapshot time: {timestamp}
      </div>
    </div>
  );
}

