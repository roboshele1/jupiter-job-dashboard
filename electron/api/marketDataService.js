import fetch from "node-fetch";

const POLYGON_API_KEY = process.env.VITE_POLYGON_API_KEY || "";

export async function fetchLastQuote(symbol) {
  if (!POLYGON_API_KEY) throw new Error("POLYGON_API_KEY not set");

  const url = `https://api.polygon.io/v2/aggs/ticker/${symbol}/prev?apiKey=${POLYGON_API_KEY}`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const data = await res.json();
    return data;
  } catch (err) {
    console.error("API fetch error:", err);
    return { error: true, message: err.message };
  }
}

