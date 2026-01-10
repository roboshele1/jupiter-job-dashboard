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
              weight
            };
          });

        setInsights({
          snapshotAvailable: true,
          timestamp: snapshot?.timestamp ?? null,
          totalValue,
          totalHoldings: positions.length,
          topHoldings
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

  return (
    <div style={{ padding: 24 }}>
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
    </div>
  );
}
