import React from "react";

export default function Insights() {
  const insights = [
    {
      title: "Concentration Risk",
      message: "Top holdings account for a significant portion of portfolio exposure.",
    },
    {
      title: "Diversification",
      message: "Equity and crypto exposure are both present in the portfolio.",
    },
    {
      title: "Volatility",
      message: "Crypto allocation contributes to higher volatility bands.",
    },
  ];

  return (
    <div>
      <h1>Insights</h1>

      <p style={{ opacity: 0.7, marginBottom: 24 }}>
        Read-only portfolio intelligence generated from engine snapshots.
      </p>

      {insights.map((insight, idx) => (
        <div
          key={idx}
          style={{
            background: "#0f172a",
            borderRadius: 12,
            padding: 20,
            marginBottom: 16,
          }}
        >
          <h3>{insight.title}</h3>
          <p style={{ opacity: 0.8 }}>{insight.message}</p>
        </div>
      ))}
    </div>
  );
}

