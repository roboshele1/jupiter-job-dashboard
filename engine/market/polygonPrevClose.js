export async function getEquityPrice(symbol) {
  const key = process.env.POLYGON_API_KEY;
  if (!key) return 0;

  const url = `https://api.polygon.io/v2/aggs/ticker/${symbol}/prev?adjusted=true&apiKey=${key}`;
  const res = await fetch(url);
  const json = await res.json();

  return json?.results?.[0]?.c || 0;
}

