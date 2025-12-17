import React from "react";

/*
 Phase Q — Step 1
 Growth Intelligence Surfacing (Engine-First, UI-Light)

 This module exposes deterministic growth scoring scaffolding.
 No hype. No predictions. Pattern resemblance only.
*/

const candidates = [
  {
    symbol: "NVDA",
    revenueCAGR: 38,
    grossMargin: 74,
    fcfMargin: 32,
    rAndDIntensity: 21,
    tamExpansion: 5, // qualitative scale 1–5
  },
  {
    symbol: "TSLA",
    revenueCAGR: 28,
    grossMargin: 26,
    fcfMargin: 14,
    rAndDIntensity: 7,
    tamExpansion: 4,
  },
  {
    symbol: "NFLX",
    revenueCAGR: 21,
    grossMargin: 46,
    fcfMargin: 18,
    rAndDIntensity: 9,
    tamExpansion: 3,
  },
];

function growthScore(c) {
  // Deterministic composite (weights can be tuned later)
  return Math.round(
    c.revenueCAGR * 0.35 +
      c.grossMargin * 0.25 +
      c.fcfMargin * 0.2 +
      c.rAndDIntensity * 0.1 +
      c.tamExpansion * 10 * 0.1
  );
}

function tier(score) {
  if (score >= 70) return "ELITE";
  if (score >= 55) return "STRONG";
  if (score >= 40) return "EMERGING";
  return "WEAK";
}

export default function Growth() {
  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Growth Intelligence</h1>

      <div style={styles.card}>
        <div style={styles.header}>
          <span>Symbol</span>
          <span>Growth Score</span>
          <span>Tier</span>
        </div>

        {candidates.map((c) => {
          const score = growthScore(c);
          const t = tier(score);
          return (
            <div key={c.symbol} style={styles.row}>
              <strong>{c.symbol}</strong>
              <span>{score}</span>
              <span style={styles.tier(t)}>{t}</span>
            </div>
          );
        })}
      </div>

      <div style={styles.notice}>
        Scores represent resemblance to historical growth winners based on
        fundamentals and scale vectors. No forecasts. No timing.
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    padding: "32px",
    background: "#020617",
    color: "#ffffff",
    fontFamily: "Inter, system-ui, sans-serif",
  },
  title: {
    fontSize: "32px",
    marginBottom: "20px",
  },
  card: {
    background: "rgba(255,255,255,0.05)",
    padding: "20px",
    borderRadius: "16px",
    maxWidth: "720px",
  },
  header: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    fontSize: "12px",
    opacity: 0.7,
    marginBottom: "10px",
  },
  row: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    padding: "10px 0",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
  },
  tier: (t) => ({
    padding: "4px 10px",
    borderRadius: "999px",
    fontSize: "12px",
    width: "fit-content",
    background:
      t === "ELITE"
        ? "#16a34a"
        : t === "STRONG"
        ? "#22c55e"
        : t === "EMERGING"
        ? "#f59e0b"
        : "#64748b",
    color: "#ffffff",
  }),
  notice: {
    marginTop: "16px",
    fontSize: "13px",
    opacity: 0.7,
    maxWidth: "720px",
  },
};

