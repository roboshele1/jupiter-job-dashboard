import { useEffect, useState } from "react";

export default function Signals() {
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
        Loading signals…
      </div>
    );
  }

  /**
   * Simple placeholder momentum logic:
   * (real momentum engine plugs in later)
   */
  const signals = crypto.holdings.map((h) => {
    let signal = "NEUTRAL";

    if (h.marketValue && h.marketValue > 10000) {
      signal = "STRONG";
    } else if (h.marketValue && h.marketValue > 1000) {
      signal = "WEAK";
    }

    return {
      symbol: h.symbol,
      signal,
      marketValue: h.marketValue || 0,
    };
  });

  return (
    <div style={{ padding: "32px" }}>
      <h1>Signals</h1>

      <h2 style={{ marginTop: "24px" }}>Crypto Momentum Signals</h2>

      <table
        style={{
          marginTop: "12px",
          borderCollapse: "collapse",
          width: "100%",
          maxWidth: "700px",
        }}
      >
        <thead>
          <tr>
            <th align="left">Asset</th>
            <th align="right">Market Value</th>
            <th align="right">Signal</th>
          </tr>
        </thead>
        <tbody>
          {signals.map((s) => (
            <tr key={s.symbol}>
              <td>{s.symbol}</td>
              <td align="right">
                ${s.marketValue.toLocaleString()}
              </td>
              <td align="right">{s.signal}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

