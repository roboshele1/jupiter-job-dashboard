import { useEffect, useState } from "react";

export default function Insights() {
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
        Loading insights…
      </div>
    );
  }

  const totalValue = crypto.totals.marketValue || 0;

  const insights = crypto.holdings.map((h) => {
    let note = "Neutral position.";

    if (h.marketValue && h.marketValue > totalValue * 0.5) {
      note = "High concentration risk — dominant allocation.";
    } else if (h.marketValue && h.marketValue > totalValue * 0.25) {
      note = "Significant allocation — monitor volatility.";
    } else if (h.marketValue && h.marketValue > 0) {
      note = "Minor allocation — low portfolio impact.";
    }

    return {
      symbol: h.symbol,
      note,
      marketValue: h.marketValue || 0,
    };
  });

  return (
    <div style={{ padding: "32px" }}>
      <h1>Insights</h1>

      <h2 style={{ marginTop: "24px" }}>
        Crypto Portfolio Insights
      </h2>

      <div
        style={{
          marginTop: "16px",
          background: "#0f172a",
          padding: "20px",
          borderRadius: "12px",
          maxWidth: "700px",
        }}
      >
        <div style={{ opacity: 0.7 }}>
          Total Crypto Exposure
        </div>
        <div style={{ fontSize: "28px", marginTop: "8px" }}>
          ${totalValue.toLocaleString()}
        </div>
      </div>

      <table
        style={{
          marginTop: "24px",
          borderCollapse: "collapse",
          width: "100%",
          maxWidth: "900px",
        }}
      >
        <thead>
          <tr>
            <th align="left">Asset</th>
            <th align="right">Market Value</th>
            <th align="left">Insight</th>
          </tr>
        </thead>
        <tbody>
          {insights.map((i) => (
            <tr key={i.symbol}>
              <td>{i.symbol}</td>
              <td align="right">
                ${i.marketValue.toLocaleString()}
              </td>
              <td>{i.note}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

