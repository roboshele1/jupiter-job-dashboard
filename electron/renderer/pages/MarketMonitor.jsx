import { useEffect, useState } from "react";
import { getMarketSnapshot } from "../services/marketSnapshot";

export default function MarketMonitor() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        const snapshot = await getMarketSnapshot();
        if (alive) setData(snapshot);
      } catch (e) {
        if (alive) setError(e.message);
      }
    }

    load();
    const id = setInterval(load, 10000);

    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  if (error) return <div>Error: {error}</div>;
  if (!data) return <div>Loading market data…</div>;

  return (
    <div>
      <h2>Crypto</h2>
      {data.crypto.map(c => (
        <div key={c.symbol}>
          {c.symbol}: ${c.price.toLocaleString()}
        </div>
      ))}

      <h2>Equities</h2>
      {data.equities.map(e => (
        <div key={e.symbol}>
          {e.symbol}: ${e.price.toLocaleString()}
        </div>
      ))}
    </div>
  );
}

