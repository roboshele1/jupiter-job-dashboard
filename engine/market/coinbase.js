export async function getCryptoPrice(symbol) {
  const pair = symbol === "BTC" ? "BTC-USD" : "ETH-USD";
  const url = `https://api.coinbase.com/v2/prices/${pair}/spot`;
  const res = await fetch(url);
  const json = await res.json();
  return Number(json?.data?.amount || 0);
}

