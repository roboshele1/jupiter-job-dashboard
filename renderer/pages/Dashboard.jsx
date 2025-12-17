import { useEffect, useState } from "react";

export default function Dashboard() {
  const [snapshot, setSnapshot] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!window.jupiter?.portfolio?.getSnapshot) {
      setError("Portfolio IPC unavailable");
      return;
    }

    window.jupiter.portfolio
      .getSnapshot()
      .then(setSnapshot)
      .catch(err => setError(err.message));
  }, []);

  if (error) {
    return <div style={{ padding: 32, color: "red" }}>{error}</div>;
  }

  if (!snapshot || snapshot.health?.isComplete !== true) {
    return <div style={{ padding: 32 }}>Loading dashboard…</div>;
  }

  const { totals, positions } = snapshot;

  const fmt = v =>
    typeof v === "number" ? v.toLocaleString() : "—";

  return (
    <div style={{ padding: 32 }}>
      <h1>Dashboard</h1>

      <div style={{ display: "flex", gap: 24, marginTop: 24 }}>
        <div style={{ background: "#0f172a", padding: 20, borderRadius: 12 }}>
          <div>Total Portfolio Value</div>
          <div style={{ fontSize: 28 }}>
            ${fmt(totals.portfolioValue)}
          </div>
        </div>

        <div style={{ background: "#0f172a", padding: 20, borderRadius: 12 }}>
          <div>Assets</div>
          <div style={{ fontSize: 28 }}>
            {positions.length}
          </div>
        </div>
      </div>
    </div>
  );
}

