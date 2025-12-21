import React, { useEffect, useState } from "react";

export default function MarketMonitor() {
  const [data, setData] = useState({});
  const [status, setStatus] = useState("loading");
  const [lastUpdated, setLastUpdated] = useState(null);

  async function fetchSnapshot() {
    try {
      setStatus("loading");
      const res = await window.electron.invoke("prices:getSnapshot");

      if (!res?.ok) {
        throw new Error("Snapshot failed");
      }

      setData(res.data);
      setLastUpdated(new Date().toLocaleTimeString());
      setStatus("ok");
    } catch (err) {
      console.error("[MARKET MONITOR]", err);
      setStatus("error");
    }
  }

  // Initial load + 10s refresh (institutional cadence)
  useEffect(() => {
    fetchSnapshot();
    const interval = setInterval(fetchSnapshot, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ padding: "24px" }}>
      <h1>Market Monitor</h1>

      <p style={{ opacity: 0.7 }}>
        Read-only live market snapshot (IPC authoritative)
      </p>

      {status === "loading" && <p>Loading market data…</p>}
      {status === "error" && (
        <p style={{ color: "red" }}>Failed to load market data</p>
      )}

      {status === "ok" && (
        <>
          <table style={{ marginTop: "16px", width: "100%" }}>
            <thead>
              <tr>
                <th align="left">Asset</th>
                <th align="right">Price</th>
                <th align="left">Source</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(data).map(([symbol, info]) => (
                <tr key={symbol}>
                  <td>{symbol}</td>
                  <td align="right">
                    {info.price?.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                  <td>{info.source}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <p style={{ marginTop: "12px", fontSize: "12px", opacity: 0.6 }}>
            Last updated: {lastUpdated}
          </p>

          <button
            onClick={fetchSnapshot}
            style={{ marginTop: "12px" }}
          >
            Refresh
          </button>
        </>
      )}
    </div>
  );
}

