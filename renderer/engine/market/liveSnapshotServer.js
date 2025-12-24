// renderer/engine/market/liveSnapshotServer.js
import express from 'express';
import fetch from 'node-fetch';

const app = express();
const PORT = process.env.PORT || 3001;

/**
 * Canonical Live Pricing Contract
 * @param {string[]} symbols
 * @returns {Object} { SYMBOL: { price } }
 */
export async function getLivePrices(symbols = []) {
  const results = {};

  for (const symbol of symbols) {
    try {
      let url;

      // Simple routing: crypto vs equity
      if (symbol === 'BTC' || symbol === 'ETH') {
        url = `https://api.coinbase.com/v2/prices/${symbol}-USD/spot`;
        const res = await fetch(url);
        const json = await res.json();
        results[symbol] = { price: Number(json.data.amount) };
      } else {
        // Polygon equity pricing (last trade)
        const apiKey = process.env.POLYGON_API_KEY;
        url = `https://api.polygon.io/v2/last/trade/${symbol}?apiKey=${apiKey}`;
        const res = await fetch(url);
        const json = await res.json();
        results[symbol] = { price: json?.results?.p ?? 0 };
      }
    } catch (err) {
      results[symbol] = { price: 0 };
    }
  }

  return results;
}

/* --- Optional HTTP wrapper (non-blocking) --- */
app.get('/prices', async (req, res) => {
  const symbols = (req.query.symbols || '').split(',').filter(Boolean);
  const prices = await getLivePrices(symbols);
  res.json(prices);
});

app.listen(PORT, () => {
  console.log(`Market Snapshot Server running on port ${PORT}`);
});

