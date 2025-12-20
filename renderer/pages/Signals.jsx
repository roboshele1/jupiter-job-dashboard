import React from "react";

export default function Signals() {
  const signals = [
    { name: "Momentum", status: "Active" },
    { name: "Mean Reversion", status: "Inactive" },
    { name: "Trend Stability", status: "Active" },
  ];

  return (
    <div style={{ padding: 32 }}>
      <h1 style={{ fontSize: 36, marginBottom: 16 }}>Signals</h1>

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ textAlign: "left", opacity: 0.7 }}>
            <th>Signal</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {signals.map((s, i) => (
            <tr key={i}>
              <td style={{ padding: "10px 0" }}>{s.name}</td>
              <td style={{ padding: "10px 0" }}>{s.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

