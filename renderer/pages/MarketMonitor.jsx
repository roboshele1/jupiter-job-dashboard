import { useEffect, useState } from "react";
import { fetchMarketMonitorPrices } from "../services/marketMonitorPriceService";

// SAFE bridge from preload (read-only)
const POLYGON_KEY = window?.env?.POLYGON_API_KEY || null;

const HOLDINGS = [
  { symbol: "BTC", source: "coinbase" },
  { symbol: "ETH", source: "coinbase" },
  { symbol: "NVDA", source: "polygon" },
  { symbol: "ASML", source: "polygon" },
  { symbol: "AVGO", source: "polygon" },
  { symbol: "MSTR", source: "polygon" },
  { symbol: "HOOD", source: "polygon" },
  { symbol: "BMNR", source: "polygon" },
  { symbol: "APLD", source: "polygon" },
];

export default function MarketMonitor() {
  const [snapshotAt, setSnapshotAt] = useState(new Date());
  const [tickCount, setTickCount] = useState(0);
  const [prices, setPrices] = useState({});
  const [lastPollOkCount, setLastPollOkCount] = useState(0);

  useEffect(() => {
    let alive = true;

    const poll = async () => {
      // heartbeat always advances
      setSnapshotAt(new Date());
      setTickCount((c) => c + 1);

      try {
        const data = await fetchMarketMonitorPrices(HOLDINGS, {
          polygonKey: POLYGON_KEY,
        });
        if (!alive) return;

        setPrices(data);

        const okCount = Object.values(data).filter(
          (x) => x && x.ok
        ).length;
        setLastPollOkCount(okCount);

        console.log(
          "[MarketMonitor] poll ok:",
          okCount,
          "of",
          HOLDINGS.length
        );
      } catch (err) {
        console.error("[MarketMonitor] poll fatal error:", err);
      }
    };

    poll(); // immediate
    const interval = setInterval(poll, 10_000);

    return () => {
      alive = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <div>
      <h1>Market Monitor</h1>
      <div>
        Snapshot as of: {snapshotAt.toLocaleString()} <br />
        Auto-refresh: every 10 seconds <br />
        Poll ticks: {tickCount} · Prices fetched: {lastPollOkCount}/
        {HOLDINGS.length}
      </div>

      <h2>Holdings (Live Monitor)</h2>
      <ul>
        {HOLDINGS.map(({ symbol, source }) => {
          const p = prices[symbol];
          return (
            <li key={symbol}>
              {symbol} — @{" "}
              {p?.price != null ? `$${p.price.toFixed(2)}` : "—"} (
              {source})
              {p?.error ? ` [${p.error}]` : ""}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

