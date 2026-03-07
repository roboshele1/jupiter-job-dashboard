import { C } from "../styles/colorScheme.js";
import { useEffect, useState } from "react";

export default function RiskLab() {
  const [snapshot, setSnapshot] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!window.api || !window.api.portfolio) {
      setError("IPC bridge missing");
      return;
    }

    window.api.portfolio
      .getSnapshot()
      .then((data) => {
        setSnapshot(data);
      })
      .catch((err) => {
        setError(err.message || "Failed to load portfolio snapshot");
      });
  }, []);

  if (error) {
    return (
      <div style={{ padding: "32px", color: "red" }}>
        {error}
      </div>
    );
  }

  if (!snapshot) {
    return (
      <div style={{ padding: "32px" }}>
        Loading risk analysis…
      </div>
    );
  }

  const { totals } = snapshot;
  const baseValue = totals.marketValue || 0;

  const stressScenarios = [
    { label: "Mild Drawdown (-10%)", factor: 0.9 },
    { label: "Correction (-25%)", factor: 0.75 },
    { label: "Severe Crash (-50%)", factor: 0.5 },
    { label: "Black Swan (-70%)", factor: 0.3 },
  ].map((s) => ({
    label: s.label,
    stressedValue: +(baseValue * s.factor).toFixed(2),
    loss: +(baseValue * (1 - s.factor)).toFixed(2),
  }));

  return (
    <div style={{ padding: "32px" }}>
      <h1>Risk Lab — Stress Testing</h1>

      <h2 style={{ marginTop: "24px" }}>
        Portfolio Stress Scenarios
      </h2>

      <div
        style={{
          marginTop: "16px",
          background: "#0f172a",
          padding: "20px",
          borderRadius: "12px",
          maxWidth: "600px",
        }}
      >
        <div style={{ opacity: 0.7 }}>
          Current Portfolio Value
        </div>
        <div style={{ fontSize: "28px", marginTop: "8px" }}>
          ${baseValue.toLocaleString()}
        </div>
      </div>

      <table
        style={{
          marginTop: "24px",
          borderCollapse: "collapse",
          width: "100%",
          maxWidth: "800px",
        }}
      >
        <thead>
          <tr>
            <th align="left">Scenario</th>
            <th align="right">Stressed Value</th>
            <th align="right">Loss</th>
          </tr>
        </thead>
        <tbody>
          {stressScenarios.map((s) => (
            <tr key={s.label}>
              <td>{s.label}</td>
              <td align="right">
                ${s.stressedValue.toLocaleString()}
              </td>
              <td align="right">
                ${s.loss.toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

