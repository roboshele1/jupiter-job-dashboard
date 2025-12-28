const axios = require("axios");

const POLYGON_KEY = process.env.POLYGON_API_KEY;
const COINBASE = "https://api.coinbase.com/v2/prices";

async function getEquityPrices(symbols) {
  const out = {};
  for (const s of symbols) {
    try {
      const r = await axios.get(
        `https://api.polygon.io/v2/aggs/ticker/${s}/prev`,
        { params: { adjusted: true, apiKey: POLYGON_KEY } }
      );
      out[s] = r.data?.results?.[0]?.c ?? null;
    } catch {
      out[s] = null;
    }
  }
  return out;
}

async function getCryptoPrices(symbols) {
  const out = {};
  for (const s of symbols) {
    try {
      const pair = `${s}-USD`;
      const r = await axios.get(`${COINBASE}/${pair}/spot`);
      out[s] = Number(r.data?.data?.amount) || null;
    } catch {
      out[s] = null;
    }
  }
  return out;
}

async function getLivePrices() {
  // symbols are inferred from snapshot in renderer
  const equities = ["NVDA","ASML","AVGO","MSTR","HOOD","BMNR","APLD"];
  const crypto = ["BTC","ETH"];

  return {
    ...(await getEquityPrices(equities)),
    ...(await getCryptoPrices(crypto))
  };
}

module.exports = { getLivePrices };

