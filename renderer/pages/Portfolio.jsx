import { useEffect, useState } from 'react';

export default function Portfolio() {
  const [snapshot, setSnapshot] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        if (!window.jupiter?.getSnapshot) {
          throw new Error('IPC_NOT_AVAILABLE');
        }
        const data = await window.jupiter.getSnapshot();
        setSnapshot(data);
      } catch (err) {
        setError(err.message);
      }
    }
    load();
  }, []);

  if (error) {
    return <div style={{ color: 'red' }}>Error: {error}</div>;
  }

  if (!snapshot) {
    return <div>Loading portfolio…</div>;
  }

  return (
    <div>
      <h1>Portfolio</h1>

      <table>
        <thead>
          <tr>
            <th>Symbol</th>
            <th>Cost USD</th>
            <th>Live USD</th>
            <th>Δ</th>
          </tr>
        </thead>
        <tbody>
          {snapshot.positions.map((p) => (
            <tr key={p.symbol}>
              <td>{p.symbol}</td>
              <td>{p.costUSD.toFixed(2)}</td>
              <td>{p.liveUSD.toFixed(2)}</td>
              <td>{p.deltaUSD.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>Total Value (USD): {snapshot.totals.valueUSD.toFixed(2)}</h3>
    </div>
  );
}

