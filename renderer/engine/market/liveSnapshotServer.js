// renderer/engine/market/liveSnapshotServer.js
// Market Snapshot Server (READ-ONLY)
// Phase 5 — Institutional live snapshot backend
// PORT 3001 — LOCKED

import express from "express";
import cors from "cors";
import axios from "axios";

const app = express();
const PORT = process.env.PORT || 3001;

const POLYGON_API_KEY = "jyA2YblY5AP7pkvNtyBhpfTNQcSczcAS";

app.use(cors());
app.use(express.json());

async function fetchLivePrices(symbols = []) {
  const prices = {};

  for (const symbol of symbols) {
    // Crypto via Coinbase
    if (symbol === "BTC" || symbol === "ETH") {
      const res = await axios.get(
        `https://api.coinbase.com/v2/prices/${symbol}-USD/spot`
      );
      prices[symbol] = {
        price: Number(res.data.data.amount),
        currency: "USD",
      };
    }

    // Equities via Polygon
    else {
      const res = await axios.get(
        `https://api.polygon.io/v2/aggs/ticker/${symbol}/prev`,
        { params: { apiKey: POLYGON_API_KEY } }
      );
      prices[symbol] = {
        price: res.data.results?.[0]?.c ?? null,
        currency: "USD",
      };
    }
  }

  return {
    source: "live",
    timestamp: new Date().toISOString(),
    prices,
  };
}

app.get("/health", (_, res) => {
  res.json({ status: "ok", service: "market-snapshot" });
});

app.get("/snapshot", async (_, res) => {
  try {
    const symbols = ["BTC", "ETH"]; // placeholder until holdings injected
    const live = await fetchLivePrices(symbols);
    res.json(live);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Market Snapshot Server running on port ${PORT}`);
});

