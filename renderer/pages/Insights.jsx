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

        setInsights({
          snapshotAvailable: !!snapshot,
          timestamp: snapshot?.timestamp ?? null,
          totalValue: snapshot?.totalValue ?? null,
          allocation: snapshot?.allocation ?? null,
          topHoldingsCount: snapshot?.topHoldings?.length ?? 0
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
          <strong>Snapshot available:</strong>{" "}
          {insights.snapshotAvailable ? "Yes" : "No"}
        </li>

        <li>
          <strong>Snapshot timestamp:</strong>{" "}
          {insights.timestamp
            ? new Date(insights.timestamp).toLocaleString()
            : "N/A"}
        </li>

        <li>
          <strong>Total portfolio value:</strong>{" "}
          {insights.totalValue ?? "N/A"}
        </li>

        <li>
          <strong>Top holdings count:</strong>{" "}
          {insights.topHoldingsCount}
        </li>
      </ul>

      <p style={{ marginTop: 16, opacity: 0.7 }}>
        Read-only renderer. No signals, alerts, or notifications rendered yet.
      </p>
    </div>
  );
}

