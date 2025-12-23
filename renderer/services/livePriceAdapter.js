// renderer/services/livePriceAdapter.js

const POLYGON_KEY = "jyA2YblY5AP7pkvNtyBhpfTNQcSczcAS";

const EQUITY_MAP = {
  ASML: "XNAS:ASML",
  NVDA: "XNAS:NVDA",
  AVGO: "XNAS:AVGO",
  MSTR: "XNAS:MSTR",
  HOOD: "XNAS:HOOD",
  BMNR: "XNYS:BMNR",
  APLD: "XNAS:APLD",
};

const CRYPTO_MAP = {
  BTC: "BTC-USD",
  ETH: "ETH-USD",
};

async function fetchPolygonPrice(symbol) {
  const ticker = EQUITY_MAP[symbol];
  const url = `https://api.polygon.io/v2/last/trade/${ticker}?apiKey=${POLYGON_KEY}`;
  const res = await fetch(url);
  const json = await res.json();
  return Number(json?.results?.p ?? null);
}

async function fetchCoinbasePrice(pair) {
  const url = `https://api.coinbase.com/v2/prices/${pair}/spot`;
  const res = await fetch(url);
  const json = await res.json();
  return Number(json?.data?.amount ?? null);
}

export async function getLivePrices() {
  const out = {};

  for (const s of Object.keys(EQUITY_MAP)) {
    out[s] = await fetchPolygonPrice(s);
  }

  for (const s of Object.keys(CRYPTO_MAP)) {
    out[s] = await fetchCoinbasePrice(CRYPTO_MAP[s]);
  }

  return out;
}

