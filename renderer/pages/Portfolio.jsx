import React, { useEffect, useState } from "react";

export default function Portfolio() {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    let mounted = true;

    async function load() {
      const snapshotRows = [
        { symbol: "ASML", qty: 10, snapshot: 10560.20 },
        { symbol: "NVDA", qty: 73, snapshot: 13212.27 },
        { symbol: "AVGO", qty: 80, snapshot: 27228.80 },
        { symbol: "BTC", qty: 0.251083, snapshot: 22597.47 },
        { symbol: "ETH", qty: 0.25, snapshot: 702.80 },
        { symbol: "MSTR", qty: 25, snapshot: 4120.50 },
        { symbol: "HOOD", qty: 35, snapshot: 4247.25 },
        { symbol: "BMNR", qty: 115, snapshot: 2300.00 },
        { symbol: "APLD", qty: 150, snapshot: 5482.05 }
      ];

      const cryptoPrices = await window.prices.getCrypto();

      const enriched = snapshotRows.map(r => {
        if (!cryptoPrices[r.symbol]) {
          return { ...r, live: null, delta: null, deltaPct: null };
        }

        const live = cryptoPrices[r.symbol] * r.qty;
        const delta = live - r.snapshot;
        const deltaPct = (delta / r.snapshot) * 100;

        return {
          ...r,
          live,
          delta,
          deltaPct
        };
      });

      if (mounted) setRows(enriched);
    }

    load();
    return () => { mounted = false; };
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
              <td>{r.live ? `$${r.live.toFixed(2)}` : "—"}</td>
              <td>{r.delta ? `$${r.delta.toFixed(2)}` : "—"}</td>
              <td>{r.deltaPct ? `${r.deltaPct.toFixed(2)}%` : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

