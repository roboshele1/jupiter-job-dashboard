import React from "react";

export default function Portfolio() {
  const rows = [
    { symbol: "ASML", qty: 10, snapshot: 10560.20 },
    { symbol: "NVDA", qty: 73, snapshot: 13212.27 },
    { symbol: "AVGO", qty: 80, snapshot: 27228.80 },
    { symbol: "BTC",  qty: 0.251083, snapshot: 22597.47 },
    { symbol: "ETH",  qty: 0.25, snapshot: 702.80 },
    { symbol: "MSTR", qty: 25, snapshot: 4120.50 },
    { symbol: "HOOD", qty: 35, snapshot: 4247.25 },
    { symbol: "BMNR", qty: 115, snapshot: 2300.00 },
    { symbol: "APLD", qty: 150, snapshot: 5482.05 }
  ];

  return (
    <div style={{ padding: "32px" }}>
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
              <td>${r.snapshot.toFixed(2)}</td>
              <td>—</td>
              <td>—</td>
              <td>—</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

