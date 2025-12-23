// renderer/services/livePriceSource.js

const POLYGON_KEY = "jyA2YblY5AP7pkvNtyBhpfTNQcSczcAS";

const EQUITIES = ["ASML","NVDA","AVGO","MSTR","HOOD","BMNR","APLD"];
const CRYPTO = ["BTC","ETH"];

export async function fetchLivePrices(symbols) {
  const prices = {};

  // equities via Polygon
  if (symbols.some(s => EQUITIES.includes(s))) {
    const tickers = symbols.filter(s => EQUITIES.includes(s)).join(",");
    const res = await fetch(
      `https://api.polygon.io/v2/snapshot/locale/us/markets/stocks/tickers?tickers=${tickers}&apiKey=${POLYGON_KEY}`
    );
    const data = await res.json();
    data.tickers?.forEach(t => {
      prices[t.ticker] = t.lastTrade?.p ?? null;
    });
  }

  // crypto via Coinbase
  for (const c of symbols.filter(s => CRYPTO.includes(s))) {
    const r = await fetch(`https://api.coinbase.com/v2/prices/${c}-USD/spot`);
    const j = await r.json();
    prices[c] = Number(j.data.amount);
  }

  return prices;
}

