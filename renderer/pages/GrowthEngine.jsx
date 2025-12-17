import { useEffect, useState } from "react";

export default function GrowthEngine() {
  const [crypto, setCrypto] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!window.api || !window.api.crypto) {
      setError("IPC bridge missing");
      return;
    }

    window.api.crypto
      .getSnapshot()
      .then((snapshot) => {
        setCrypto(snapshot);
      })
      .catch((err) => {
        setError(err.message || "Failed to load crypto snapshot");
      });
  }, []);

  if (error) {
    return (
      <div style={{ padding: "32px", color: "red" }}>
        {error}
      </div>
    );
  }

  if (!crypto) {
    return (
      <div style={{ padding: "32px" }}>
        Loading growth projections…
      </div>
    );
  }

  const currentValue = crypto.totals.marketValue || 0;

  // Simple scenario projections (engine hooks later)
  const scenarios = [
    { label: "Base (+5%)", factor: 1.05 },
    { label: "Bull (+20%)", factor: 1.2 },
    { label: "Moon (+100%)", factor: 2.0 },
    { label: "Bear (-20%)", factor: 0.8 },
  ].map((s) => ({
    label: s.label,
    projected: (currentValue * s.factor).toFixed(2),
  }));

  return (
    <div style={{ padding: "32px" }}>
      <h1>Growth Engine</h1>

      <h2 style={{ marginTop: "24px" }}>
        Crypto Growth Scenarios
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
          Current Crypto Value
        </div>
        <div style={{ fontSize: "28px", marginTop: "8px" }}>
          ${currentValue.toLocaleString()}
        </div>
      </div>

      <table
        style={{
          marginTop: "24px",
          borderCollapse: "collapse",
          width: "100%",
          maxWidth: "600px",
        }}
      >
        <thead>
          <tr>
            <th align="left">Scenario</th>
            <th align="right">Projected Value</th>
          </tr>
        </thead>
        <tbody>
          {scenarios.map((s) => (
            <tr key={s.label}>
              <td>{s.label}</td>
              <td align="right">
                ${Number(s.projected).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

