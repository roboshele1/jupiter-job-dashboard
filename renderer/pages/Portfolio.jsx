import { useEffect, useState } from "react";
import { getSnapshotRows } from "../services/snapshotAdapter";

export default function Portfolio() {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const data = await getSnapshotRows();
        if (mounted && Array.isArray(data)) {
          setRows(data);
        } else {
          setRows([]);
        }
      } catch (e) {
        console.error("Portfolio load failed:", e);
        setRows([]);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  if (!rows.length) {
    return (
      <div>
        <h1>Portfolio</h1>
        <p>Snapshot holdings with optional live price overlay.</p>
        <p>No holdings available.</p>
      </div>
    );
  }

  return (
    <div>
      <h1>Portfolio</h1>
      <p>Snapshot holdings with optional live price overlay.</p>

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
          {rows.map((r) => (
            <tr key={r.symbol}>
              <td>{r.symbol}</td>
              <td>{r.qty}</td>
              <td>${r.snapshotValue.toFixed(2)}</td>
              <td>{r.livePrice ?? "—"}</td>
              <td>{r.delta ?? "—"}</td>
              <td>{r.deltaPct ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

