// ES MODULE — CANONICAL EXPORTS
// DO NOT MODIFY NAMES

export async function getCryptoPrices() {
  const res = await fetch("https://api.coinbase.com/v2/exchange-rates?currency=USD");
  const json = await res.json();

  const rates = json.data.rates;

  return {
    BTC: Number(rates.BTC) ? 1 / Number(rates.BTC) : null,
    ETH: Number(rates.ETH) ? 1 / Number(rates.ETH) : null,
  };
}

export async function getEquityPrices() {
  const symbols = ["ASML", "NVDA", "AVGO", "MSTR", "HOOD", "BMNR", "APLD"];
  const prices = {};

  for (const symbol of symbols) {
    const res = await fetch(
      `https://api.polygon.io/v2/last/trade/${symbol}?apiKey=${process.env.POLYGON_API_KEY}`
    );
    const json = await res.json();
    prices[symbol] = json?.results?.p ?? null;
  }

  return prices;
}

