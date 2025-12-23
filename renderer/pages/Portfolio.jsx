import { useEffect, useState } from "react";

export default function Portfolio() {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    (async () => {
      const res = await window.portfolio.getSnapshot();
      if (!res.ok) {
        console.error("Snapshot IPC failed");
        return;
      }
      setRows(res.rows);
    })();
  }, []);

  return (
    <div>
      <h1>Portfolio</h1>
      <table>
        <thead>
          <tr>
            <th>Symbol</th>
            <th>Qty</th>
            <th>Snapshot $</th>
            <th>Live $</th>
            <th>Δ</th>
            <th>Δ%</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.symbol}>
              <td>{r.symbol}</td>
              <td>{r.qty}</td>
              <td>${r.snapshot.toFixed(2)}</td>
              <td>${r.live.toFixed(2)}</td>
              <td>${r.delta.toFixed(2)}</td>
              <td>{r.deltaPct.toFixed(2)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

