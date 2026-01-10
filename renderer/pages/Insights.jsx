import { useEffect, useState } from "react";

export default function Insights() {
  const [snapshot, setSnapshot] = useState(null);
  const [engineInsights, setEngineInsights] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function loadInsights() {
      try {
        const portfolioSnapshot = await window.api.invoke(
          "portfolio:getSnapshot"
        );

        const insights = await window.api.invoke("insights:compute");

        if (!mounted) return;

        setSnapshot(portfolioSnapshot);
        setEngineInsights(insights);
      } catch (err) {
        if (!mounted) return;
        setError(err?.message || "Failed to load insights");
      }
    }

    loadInsights();

    return () => {
      mounted = false;
    };
  }, []);

  if (error) {
    return (
      <div style={{ padding: 24 }}>
        <h2>Insights</h2>
        <p style={{ color: "red" }}>{error}</p>
      </div>
    );
  }

  if (!snapshot || !engineInsights) {
    return (
      <div style={{ padding: 24 }}>
        <h2>Insights</h2>
        <p>Loading insights…</p>
      </div>
    );
  }

  const positions = snapshot?.portfolio?.positions || [];
  const totalValue = positions.reduce(
    (sum, p) => sum + (p.liveValue || 0),
    0
  );

  const topHoldings = positions
    .slice()
    .sort((a, b) => b.liveValue - a.liveValue)
    .slice(0, 5)
    .map(p => ({
      symbol: p.symbol,
      value: p.liveValue,
      weight:
        totalValue > 0 ? ((p.liveValue / totalValue) * 100).toFixed(1) : "0.0"
    }));

  return (
    <div style={{ padding: 24 }}>
      <h2>Insights (V1)</h2>

      <ul>
        <li>
          <strong>Snapshot available:</strong> Yes
        </li>
        <li>
          <strong>Snapshot timestamp:</strong>{" "}
          {new Date(snapshot.timestamp).toLocaleString()}
        </li>
        <li>
          <strong>Total portfolio value:</strong>{" "}
          ${totalValue.toLocaleString()}
        </li>
        <li>
          <strong>Total holdings:</strong> {positions.length}
        </li>
      </ul>

      <h3 style={{ marginTop: 24 }}>Top Holdings</h3>

      <ul>
        {topHoldings.map(h => (
          <li key={h.symbol}>
            <strong>{h.symbol}</strong> — $
            {h.value.toLocaleString()} ({h.weight}%)
          </li>
        ))}
      </ul>

      <p style={{ marginTop: 16, opacity: 0.7 }}>
        Read-only summary layer. No signals, alerts, or actions are generated in
        Insights V1.
      </p>

      <hr style={{ margin: "32px 0" }} />

      <h3>Insights (Engine)</h3>

      <ul>
        <li>
          <strong>Risk posture:</strong> {engineInsights.riskPosture}
        </li>
        <li>
          <strong>Diversification score:</strong>{" "}
          {engineInsights.diversificationScore}
        </li>
        <li>
          <strong>Growth tilt:</strong> {engineInsights.growthTilt}
        </li>
        <li>
          <strong>Volatility proxy:</strong>{" "}
          {engineInsights.volatilityProxy}
        </li>
        <li>
          <strong>Confidence band:</strong>{" "}
          {engineInsights.confidenceBand}
        </li>
      </ul>

      <p style={{ marginTop: 12, opacity: 0.6 }}>
        Engine-derived insights. Deterministic, read-only, and authoritative.
      </p>
    </div>
  );
}
