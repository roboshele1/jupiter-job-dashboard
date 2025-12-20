import React, { useEffect, useState } from "react";

export default function Analytics() {
  const [snapshot, setSnapshot] = useState(null);

  useEffect(() => {
    if (window.jupiter?.portfolio?.getSnapshot) {
      window.jupiter.portfolio.getSnapshot().then(setSnapshot);
    }
  }, []);

  if (!snapshot) {
    return <div>Loading analytics…</div>;
  }

  return (
    <div>
      <h2>Analytics</h2>

      <div style={{ marginBottom: 16 }}>
        <strong>Total Portfolio Value:</strong>{" "}
        ${snapshot.totalValue.toLocaleString()}
      </div>

      <div style={{ marginBottom: 16 }}>
        <strong>Total P/L:</strong>{" "}
        <span style={{ color: snapshot.totalPL >= 0 ? "#4CAF50" : "#F44336" }}>
          {snapshot.totalPL >= 0 ? "+" : "-"}$
          {Math.abs(snapshot.totalPL).toLocaleString()}
        </span>
      </div>

      <div>
        <h3>Attribution (Read-Only)</h3>
        <ul>
          {snapshot.positions.map((p) => (
            <li key={p.symbol}>
              {p.symbol}: {p.allocationPct.toFixed(2)}%
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

