import { useEffect } from "react";
import { writeSnapshot } from "../state/snapshotStore";

export default function Portfolio() {
  const computed = [
    { symbol: "ASML", qty: 10, price: 1056.02, value: 10560.2, source: "polygon" },
    { symbol: "NVDA", qty: 73, price: 180.99, value: 13212.27, source: "polygon" },
    { symbol: "AVGO", qty: 80, price: 340.36, value: 27228.8, source: "polygon" },
    { symbol: "BTC", qty: 0.251083, price: 89756.16, value: 22536.25, source: "coinbase" },
    { symbol: "ETH", qty: 0.25, price: 3048.7, value: 762.17, source: "coinbase" },
    { symbol: "MSTR", qty: 25, price: 164.82, value: 4120.5, source: "polygon" },
    { symbol: "HOOD", qty: 35, price: 121.35, value: 4247.25, source: "polygon" },
    { symbol: "BMNR", qty: 115, price: 31.36, value: 3606.4, source: "polygon" },
    { symbol: "APLD", qty: 150, price: 27.85, value: 4177.5, source: "polygon" }
  ];

  const totalValue = computed.reduce((s, r) => s + r.value, 0);

  useEffect(() => {
    writeSnapshot({
      timestamp: new Date().toISOString(),
      totalValue,
      rows: computed
    });
  }, []);

  return (
    <div>
      <h1>Portfolio</h1>
      <h2>Total Value: ${totalValue.toFixed(2)}</h2>
    </div>
  );
}

