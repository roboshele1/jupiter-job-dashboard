import React, { useEffect, useState } from "react";

import { getQuote } from "../src/services/marketData";
import { getCryptoQuote } from "../src/services/cryptoMarketData";

import holdings from "../data/holdings";

export default function Portfolio() {
  const [rows, setRows] = useState([]);
  const [totalValue, setTotalValue] = useState(0);

  useEffect(() => {
    async function load() {
      let computedRows = [];
      let total = 0;

      for (const h of holdings) {
        let quote;

        if (h.assetType === "Digital") {
          quote = await getCryptoQuote(h.symbol);
        } else {
          quote = await getQuote(h.symbol);
        }

        const price = Number(quote.price);
        const qty = Number(h.quantity);

        const value = price * qty;

        total += value;

        computedRows.push({
          symbol: h.symbol,
          quantity: qty,
          price,
          value,
          source: h.assetType === "Digital" ? "coinbase" : "polygon"
        });
      }

      setRows(computedRows);
      setTotalValue(total);
    }

    load();
  }, []);

  return (
    <div style={{ padding: "24px" }}>
      <h2>Portfolio</h2>
      <h3>Total Value: ${totalValue.toFixed(2)}</h3>

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
          {rows.map((r) => (
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

