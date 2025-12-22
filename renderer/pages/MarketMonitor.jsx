import { useEffect, useState } from "react";

export default function MarketMonitor() {
  const [snapshot, setSnapshot] = useState(null);
  const [uptime, setUptime] = useState(0);

  const fetchSnapshot = async () => {
    try {
      if (!window.api?.getMarketSnapshot) {
        throw new Error("IPC bridge not available");
      }
      const data = await window.api.getMarketSnapshot();
      setSnapshot(data);
    } catch (err) {
      console.error("Market snapshot fetch failed:", err);
    }
  };

  useEffect(() => {
    fetchSnapshot();
    const refresh = setInterval(fetchSnapshot, 10000);
    const tick = setInterval(() => setUptime((u) => u + 1), 1000);
    return () => {
      clearInterval(refresh);
      clearInterval(tick);
    };
  }, []);

  if (!snapshot) return <div>Loading market snapshot...</div>;

  const cryptoEntries = snapshot.crypto && typeof snapshot.crypto === "object"
    ? Object.entries(snapshot.crypto)
    : [];

  const equityEntries = snapshot.equities && typeof snapshot.equities === "object"
    ? Object.entries(snapshot.equities)
    : [];

  return (
    <div>
      <h1>Market Monitor</h1>
      <p>Snapshot time: {snapshot.timestamp}</p>
      <p>Auto-refresh: every 10s · uptime {uptime}s</p>

      <h2>Crypto</h2>
      <ul>
        {cryptoEntries.map(([symbol, asset]) => (
          <li key={symbol}>
            {symbol}: ${asset.price} ({asset.source})
          </li>
        ))}
      </ul>

      <h2>Equities</h2>
      <ul>
        {equityEntries.map(([symbol, asset]) => (
          <li key={symbol}>
            {symbol}: ${asset.price} ({asset.source})
          </li>
        ))}
      </ul>
    </div>
  );
}

