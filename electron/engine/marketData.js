import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const POLYGON_BASE = "https://api.polygon.io";

function assertApiKey() {
  if (!process.env.POLYGON_API_KEY) {
    throw new Error("POLYGON_API_KEY is missing");
  }
}

export async function fetchEquityPrice(symbol) {
  assertApiKey();

  const url = `${POLYGON_BASE}/v2/aggs/ticker/${symbol}/prev?adjusted=true&apiKey=${process.env.POLYGON_API_KEY}`;
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`Polygon equity fetch failed for ${symbol}`);
  }

  const json = await res.json();
  if (!json.results || !json.results[0]) {
    throw new Error(`Invalid Polygon equity response for ${symbol}`);
  }

  return json.results[0].c;
}

export async function fetchCryptoPrice(symbol) {
  assertApiKey();

  const url = `${POLYGON_BASE}/v2/aggs/ticker/${symbol}/prev?adjusted=true&apiKey=${process.env.POLYGON_API_KEY}`;
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`Polygon crypto fetch failed for ${symbol}`);
  }

  const json = await res.json();
  if (!json.results || !json.results[0]) {
    throw new Error(`Invalid Polygon crypto response for ${symbol}`);
  }

  return json.results[0].c;
}

