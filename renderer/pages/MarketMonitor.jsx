import React, { useEffect, useState } from "react";

export default function MarketMonitor() {
  const [snapshot, setSnapshot] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function loadMarket() {
      try {
        if (
          !window.api ||
          !window.api.market ||
          typeof window.api.market.getSnapshot !== "function"
        ) {
          throw new Error("Market IPC not available");
        }

        const data = await window.api.market.getSnapshot();

        if (mounted) {
          setSnapshot(data);
        }
      } catch (err) {
        if (mounted) {
          setError(err.message);
        }
      }
    }

    loadMarket();
    return () => {
      mounted = false;
    };
  }, []);

  if (error) {
    return <div style={{ color: "red" }}>Error: {error}</div>;
  }

  if (!snapshot) {
    return <div>Loading market monitor…</div>;
  }

  return (
    <div>
      <h1>Market Monitor</h1>

      {snapshot.markets.length === 0 ? (
        <div>No markets being monitored.</div>
      ) : (
        <ul>
          {snapshot.markets.map((market, idx) => (
            <li key={idx}>{JSON.stringify(market)}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

