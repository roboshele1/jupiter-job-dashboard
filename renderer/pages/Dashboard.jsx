import { useEffect, useState } from "react";

export default function Dashboard() {
  const [snapshot, setSnapshot] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        if (!window.api || typeof window.api.getMarketSnapshot !== "function") {
          throw new Error("IPC API not available yet");
        }
        const data = await window.api.getMarketSnapshot();
        setSnapshot(data);
      } catch (e) {
        setError(e.message);
      }
    }
    load();
  }, []);

  if (error) {
    return (
      <div style={{ padding: 24 }}>
        <h2>Dashboard</h2>
        <p style={{ color: "#888" }}>Waiting for market snapshot…</p>
      </div>
    );
  }

  if (!snapshot) {
    return (
      <div style={{ padding: 24 }}>
        <h2>Dashboard</h2>
        <p>Loading…</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <h2>Total Value</h2>
      <p>${snapshot.totalValue?.toFixed?.(2) ?? "0.00"}</p>
    </div>
  );
}

