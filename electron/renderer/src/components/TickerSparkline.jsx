import React, { useEffect, useState } from "react";
import { Sparklines, SparklinesLine } from "react-sparklines";
import axios from "axios";

export default function TickerSparkline({ symbol }) {
  const [historicalData, setHistoricalData] = useState([]);

  useEffect(() => {
    async function fetchHistorical() {
      try {
        const POLYGON_API_KEY = "jyA2YblY5AP7pkvNtyBhpfTNQcSczcAS"; // Your API key
        const resp = await axios.get(
          `https://api.polygon.io/v2/aggs/ticker/${symbol}/range/1/day/2025-01-01/2025-12-12?adjusted=true&sort=asc&limit=100&apiKey=${POLYGON_API_KEY}`
        );
        const prices = resp.data.results.map((r) => r.c);
        setHistoricalData(prices);
      } catch (err) {
        console.error(`Historical fetch failed for ${symbol}:`, err.message);
        setHistoricalData([]);
      }
    }
    fetchHistorical();
  }, [symbol]);

  return (
    <div className="sparkline-container">
      <Sparklines data={historicalData} width={120} height={40}>
        <SparklinesLine color="#4caf50" />
      </Sparklines>
    </div>
  );
}

