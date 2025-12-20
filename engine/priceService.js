// engine/priceService.js
// AUTHORITATIVE LIVE PRICING
// Equities: Polygon
// Crypto: Coinbase

const POLY_KEY = process.env.POLYGON_API_KEY;

if (!POLY_KEY) {
  throw new Error("POLYGON_API_KEY not set in environment");
}

// ---------- HELPERS ----------
async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Fetch failed ${res.status}`);
  }
  return res.json();
}

// ---------- CRYPTO ----------
async function getCrypto(symbol) {
  const pair = `${symbol}-USD`;
  const data = await fetchJSON(
    `https://api.coinbase.com/v2/prices/${pair}/spot`
  );

  return {
    price: parseFloat(data.data.amount),
    source: "coinbase",
  };
}

// ---------- EQUITIES ----------
async function getEquity(symbol) {
  const url =
    `https://api.polygon.io/v2/aggs/ticker/${symbol}/prev` +
    `?adjusted=true&apiKey=${POLY_KEY}`;

  const data = await fetchJSON(url);

  const price = data?.results?.[0]?.c ?? 0;

  return {
    price,
    source: "polygon",
  };
}

// ---------- PUBLIC ----------
export async function getPrices(symbols = []) {
  const prices = {};

  for (const symbol of symbols) {
    if (["BTC", "ETH"].includes(symbol)) {
      prices[symbol] = (await getCrypto(symbol)).price;
    } else {
      prices[symbol] = (await getEquity(symbol)).price;
    }
  }

  return prices;
}

