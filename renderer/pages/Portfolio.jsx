import { useEffect, useState } from "react";
import { writeSnapshot } from "../state/snapshotStore";

const HOLDINGS = [
  { symbol: "ASML", qty: 10, price: 1056.02, source: "polygon" },
  { symbol: "NVDA", qty: 73, price: 180.99, source: "polygon" },
  { symbol: "AVGO", qty: 80, price: 340.36, source: "polygon" },
  { symbol: "MSTR", qty: 25, price: 164.82, source: "polygon" },
  { symbol: "HOOD", qty: 35, price: 121.35, source: "polygon" },
  { symbol: "BMNR", qty: 115, price: 31.36, source: "polygon" },
  { symbol: "APLD", qty: 150, price: 27.85, source: "polygon" },
  { symbol: "BTC", qty: 0.251083, price: 89756.16, source: "coinbase" },
  { symbol: "ETH", qty: 0.25, price: 3048.70, source: "coinbase" }
];

export default function Portfolio() {
  const rows = HOLDINGS.map(h => ({
    ...h,
    value: h.qty * h.price
  }));

  const totalValue = rows.reduce((s, r) => s + r.value, 0);

  useEffect(() => {
    writeSnapshot({
      timestamp: new Date().toISOString(),
      totalValue,
      rows
    });
  }, []);

  return (
    <div>
      <h1>Portfolio</h1>
      <h2>Total Value: ${totalValue.toFixed(2)}</h2>

      <table>
        <thead>
          <tr>
            <th>Symbol</th>
            <th>Qty</th>
            <th>Price</th>
            <th>Value</th>
            <th>Source</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.symbol}>
              <td>{r.symbol}</td>
              <td>{r.qty}</td>
              <td>${r.price.toFixed(2)}</td>
              <td>${r.value.toFixed(2)}</td>
              <td>{r.source}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

