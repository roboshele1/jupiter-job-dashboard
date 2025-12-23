const { contextBridge } = require("electron");
const fetch = require("node-fetch");

const POLYGON_KEY = "jyA2YblY5AP7pkvNtyBhpfTNQcSczcAS";

// ===== EQUITIES =====
async function fetchPolygonPrice(symbol) {
  const res = await fetch(
    `https://api.polygon.io/v2/aggs/ticker/${symbol}/prev?adjusted=true&apiKey=${POLYGON_KEY}`
  );
  const json = await res.json();
  return Number(json.results[0].c);
}

// ===== CRYPTO =====
async function fetchCoinbase(pair) {
  const res = await fetch(`https://api.coinbase.com/v2/prices/${pair}/spot`);
  const json = await res.json();
  return Number(json.data.amount);
}

contextBridge.exposeInMainWorld("prices", {
  // ---- CRYPTO (already working, untouched) ----
  getCryptoPrices: async () => {
    return {
      BTC: await fetchCoinbase("BTC-USD"),
      ETH: await fetchCoinbase("ETH-USD"),
    };
  },

  // ---- EQUITIES (THIS IS WHAT WAS MISSING) ----
  getEquityPrices: async () => {
    return {
      ASML: await fetchPolygonPrice("ASML"),
      NVDA: await fetchPolygonPrice("NVDA"),
      AVGO: await fetchPolygonPrice("AVGO"),
      MSTR: await fetchPolygonPrice("MSTR"),
      HOOD: await fetchPolygonPrice("HOOD"),
      BMNR: await fetchPolygonPrice("BMNR"),
      APLD: await fetchPolygonPrice("APLD"),
    };
  },
});

