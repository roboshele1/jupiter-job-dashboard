import fetch from "node-fetch";

const POLYGON_KEY = process.env.POLYGON_API_KEY;

export async function getLivePrices(symbols = []) {
  const prices = {};

  for (const symbol of symbols) {
    if (symbol === "BTC" || symbol === "ETH") {
      const res = await fetch(`https://api.coinbase.com/v2/prices/${symbol}-USD/spot`);
      const json = await res.json();
      prices[symbol] = {
        price: Number(json.data.amount),
        source: "coinbase"
      };
    } else {
      const res = await fetch(
        `https://api.polygon.io/v2/aggs/ticker/${symbol}/prev?adjusted=true&apiKey=${POLYGON_KEY}`
      );
      const json = await res.json();
      const close = json?.results?.[0]?.c ?? 0;
      prices[symbol] = {
        price: Number(close),
        source: "polygon-prev-close"
      };
    }
  }

  return prices;
}

