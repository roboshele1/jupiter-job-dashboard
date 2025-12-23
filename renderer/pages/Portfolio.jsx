import { useEffect, useState } from "react";

export default function Portfolio() {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    (async () => {
      const snapshot = [
        { symbol: "BTC", qty: 0.251083, snapshot: 22597.47 },
        { symbol: "ETH", qty: 0.25, snapshot: 702.80 }
      ];

      const prices = await window.prices.getCryptoPrices();

      const enriched = snapshot.map(r => {
        const live = prices[r.symbol] * r.qty;
        const delta = live - r.snapshot;
        const deltaPct = (delta / r.snapshot) * 100;

        return {
          ...r,
          live,
          delta,
          deltaPct
        };
      });

      setRows(enriched);
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

