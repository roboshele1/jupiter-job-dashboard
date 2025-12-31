import React, { useEffect, useState } from "react";

export default function GrowthEngine() {
  const [snapshot, setSnapshot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!window.jupiter || typeof window.jupiter.invoke !== "function") {
      setError("IPC bridge unavailable (window.jupiter)");
      setLoading(false);
      return;
    }

    window.jupiter
      .invoke("growthEngine:run", { mode: "snapshot" })
      .then((res) => {
        setSnapshot(res);
        setLoading(false);
      })
      .catch((err) => {
        setError(err?.message || "Growth Engine invocation failed");
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="card">Loading Growth Engine…</div>;
  if (error) return <div className="card error">{error}</div>;

  const gp = snapshot?.growthProfile;

  if (!gp) {
    return <div className="card error">Invalid growth profile payload</div>;
  }

  return (
    <div className="page">
      <h1>Growth Engine</h1>

      <div className="card">
        <h3>Growth Profile</h3>
        <p>
          <strong>Starting Value:</strong>{" "}
          ${gp.startingValue.toLocaleString()}
        </p>
        <p>
          <strong>Implied CAGR:</strong>{" "}
          {(gp.impliedCAGR * 100).toFixed(2)}%
        </p>
      </div>

      <div className="card">
        <h3>Projections</h3>
        <ul>
          {gp.projections.map((p) => (
            <li key={p.year}>
              Year {p.year}: ${p.value.toLocaleString()}
            </li>
          ))}
        </ul>
      </div>

      <div className="card">
        <h3>Sensitivity Notes</h3>
        <ul>
          {gp.sensitivityNotes.map((n, i) => (
            <li key={i}>{n}</li>
          ))}
        </ul>
      </div>

      <div className="card">
        <h3>Narrative</h3>
        <p>{gp.narrative}</p>
      </div>
    </div>
  );
}

