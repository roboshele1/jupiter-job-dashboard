import { useEffect, useState } from "react";

export default function MarketMonitor() {
  const [snapshot, setSnapshot] = useState(null);

  const fetchSnapshot = async () => {
    const res = await fetch("http://localhost:3001/snapshot");
    const json = await res.json();
    setSnapshot(json);
  };

  useEffect(() => {
    fetchSnapshot();
    const id = setInterval(fetchSnapshot, 10_000);
    return () => clearInterval(id);
  }, []);

  if (!snapshot) return <div>Loading...</div>;

  return (
    <div>
      <h2>Crypto</h2>
      {snapshot.crypto.map(c => (
        <div key={c.symbol}>
          {c.symbol}: ${c.price}
        </div>
      ))}

      <h2>Equities</h2>
      {snapshot.equities.map(e => (
        <div key={e.symbol}>
          {e.symbol}: ${e.price}
        </div>
      ))}

      <div style={{ marginTop: 20, opacity: 0.6 }}>
        Last update: {new Date(snapshot.timestamp).toLocaleTimeString()}
      </div>
    </div>
  );
}

