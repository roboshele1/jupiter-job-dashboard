import { useEffect, useState } from "react";
import { getLivePrice } from "../services/marketData";

const HOLDINGS = [
  { symbol: "ASML", quantity: 10, type: "equity" },
  { symbol: "NVDA", quantity: 73, type: "equity" },
  { symbol: "AVGO", quantity: 80, type: "equity" },
  { symbol: "BTC", quantity: 0.251083, type: "digital" },
  { symbol: "ETH", quantity: 0.25, type: "digital" },
  { symbol: "MSTR", quantity: 25, type: "equity" },
  { symbol: "HOOD", quantity: 35, type: "equity" },
  { symbol: "BMNR", quantity: 115, type: "equity" },
  { symbol: "APLD", quantity: 150, type: "equity" },
];

export default function Portfolio() {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    async function load() {
      const out = [];

      for (const h of HOLDINGS) {
        if (h.type === "equity") {
          const quote = await getLivePrice(h);
          out.push({
            ...h,
            price: quote.price,
            value: quote.price * h.quantity,
            source: quote.source,
          });
        } else {
          out.push({
            ...h,
            price: 0,
            value: 0,
            source: "snapshot",
          });
        }
      }

      setRows(out);
    }

    load();
  }, []);

  const total = rows.reduce((s, r) => s + r.value, 0);

  return (
    <div>
      <h1>Portfolio</h1>
      <h3>Total Value: ${total.toFixed(2)}</h3>

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
              <td>{r.quantity}</td>
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

