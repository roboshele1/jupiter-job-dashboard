import { useEffect, useState } from "react";

export default function Insights() {
  const [insights, setInsights] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    window.api
      .invoke("portfolio:getSnapshot")
      .then(snapshot => {
        if (!mounted) return;

        const portfolio = snapshot?.portfolio;
        const positions = Array.isArray(portfolio?.positions)
          ? portfolio.positions
          : [];

        // ✅ Canonical total value derivation (single source of truth)
        const totalValue = positions.reduce(
          (sum, p) => sum + (typeof p.liveValue === "number" ? p.liveValue : 0),
          0
        );

        const topHoldings = positions
          .slice()
          .sort((a, b) => b.liveValue - a.liveValue)
          .slice(0, 5)
          .map(p => {
            const weight =
              totalValue > 0 ? (p.liveValue / totalValue) * 100 : 0;

            return {
              symbol: p.symbol,
              value: p.liveValue,
              weight,
              assetClass: p.assetClass
            };
          });

        setInsights({
          snapshotAvailable: true,
          timestamp: snapshot?.timestamp ?? null,
          totalValue,
          totalHoldings: positions.length,
          topHoldings,
          positions
        });
      })
      .catch(err => {
        if (!mounted) return;
        setError(err.message || "Failed to load insights snapshot");
      });

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

  if (!insights) {
    return (
      <div style={{ padding: 24 }}>
        <h2>Insights</h2>
        <p>Loading insights snapshot…</p>
      </div>
    );
  }

  /* ===============================
     DERIVED DATA — EXPERIMENTAL
     =============================== */

  // 1. Risk posture (concentration + holding count)
  const topWeight =
    insights.topHoldings.length > 0
      ? insights.topHoldings[0].weight
      : 0;

  let riskPosture = "LOW";
  if (topWeight > 30 || insights.totalHoldings < 6) {
    riskPosture = "HIGH";
  } else if (topWeight > 20 || insights.totalHoldings < 10) {
    riskPosture = "MODERATE";
  }

  // 2. Diversification score (simple heuristic)
  let diversificationScore = "WEAK";
  if (insights.totalHoldings >= 12 && topWeight < 25) {
    diversificationScore = "STRONG";
  } else if (insights.totalHoldings >= 8) {
    diversificationScore = "MODERATE";
  }

  // 3. Growth tilt (symbol-based)
  const growthSymbols = ["NVDA", "AVGO", "MSTR", "HOOD", "APLD"];
  const growthValue = insights.positions
    .filter(p => growthSymbols.includes(p.symbol))
    .reduce((sum, p) => sum + (p.liveValue || 0), 0);

  const growthWeight =
    insights.totalValue > 0
      ? (growthValue / insights.totalValue) * 100
      : 0;

  let growthTilt = "BALANCED";
  if (growthWeight > 50) growthTilt = "GROWTH_HEAVY";
  else if (growthWeight < 25) growthTilt = "DEFENSIVE";

  // 4. Volatility proxy (crypto vs equity)
  const cryptoValue = insights.positions
    .filter(p => p.assetClass === "crypto")
    .reduce((sum, p) => sum + (p.liveValue || 0), 0);

  const cryptoWeight =
    insights.totalValue > 0
      ? (cryptoValue / insights.totalValue) * 100
      : 0;

  let volatilityProxy = "LOW";
  if (cryptoWeight > 20) volatilityProxy = "HIGH";
  else if (cryptoWeight > 10) volatilityProxy = "MODERATE";

  // 5. Confidence band (aggregate)
  let confidenceBand = "HIGH";
  if (riskPosture === "HIGH" || volatilityProxy === "HIGH") {
    confidenceBand = "LOW";
  } else if (
    riskPosture === "MODERATE" ||
    volatilityProxy === "MODERATE"
  ) {
    confidenceBand = "MODERATE";
  }

  /* ===============================
     RENDER
     =============================== */
  return (
    <div style={{ padding: 24 }}>
      {/* ===============================
          INSIGHTS V1 (IMMUTABLE)
         =============================== */}
      <h2>Insights (V1)</h2>

      <ul>
        <li>
          <strong>Snapshot available:</strong> Yes
        </li>

        <li>
          <strong>Snapshot timestamp:</strong>{" "}
          {insights.timestamp
            ? new Date(insights.timestamp).toLocaleString()
            : "N/A"}
        </li>

        <li>
          <strong>Total portfolio value:</strong>{" "}
          ${insights.totalValue.toLocaleString()}
        </li>

        <li>
          <strong>Total holdings:</strong>{" "}
          {insights.totalHoldings}
        </li>
      </ul>

      <h3 style={{ marginTop: 24 }}>Top Holdings</h3>

      <ul>
        {insights.topHoldings.map(h => (
          <li key={h.symbol}>
            <strong>{h.symbol}</strong> — $
            {h.value.toLocaleString()} (
            {h.weight.toFixed(1)}%)
          </li>
        ))}
      </ul>

      <p style={{ marginTop: 16, opacity: 0.7 }}>
        Read-only summary layer. No signals, alerts, or actions are generated in Insights V1.
      </p>

      {/* ===============================
          INSIGHTS (EXPERIMENTAL)
         =============================== */}
      <hr style={{ margin: "32px 0", opacity: 0.3 }} />

      <h2>Insights (Experimental)</h2>

      <ul>
        <li>
          <strong>Risk posture:</strong> {riskPosture}
        </li>

        <li>
          <strong>Diversification score:</strong> {diversificationScore}
        </li>

        <li>
          <strong>Growth tilt:</strong> {growthTilt} ({growthWeight.toFixed(1)}%)
        </li>

        <li>
          <strong>Volatility proxy:</strong> {volatilityProxy} ({cryptoWeight.toFixed(1)}% crypto)
        </li>

        <li>
          <strong>Confidence band:</strong> {confidenceBand}
        </li>
      </ul>

      <p style={{ marginTop: 16, opacity: 0.6 }}>
        Experimental insights are renderer-only, deterministic, and strictly
        read-only. They do not affect any other system component.
      </p>
    </div>
  );
}
