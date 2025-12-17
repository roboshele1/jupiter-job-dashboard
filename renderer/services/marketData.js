export async function fetchQuote(symbol) {
  const apiKey = import.meta.env.VITE_POLYGON_API_KEY;

  const res = await fetch(
    `https://api.polygon.io/v2/aggs/ticker/${symbol}/prev?adjusted=true&apiKey=${apiKey}`
  );

  const json = await res.json();

  if (!json.results || !json.results[0]) {
    return {
      symbol,
      price: null,
      change: null,
      changePct: null,
    };
  }

  const o = json.results[0].o;
  const c = json.results[0].c;

  return {
    symbol,
    price: c,
    change: c - o,
    changePct: ((c - o) / o) * 100,
  };
}

