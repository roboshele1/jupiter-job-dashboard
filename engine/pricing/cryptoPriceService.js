// engine/pricing/cryptoPriceService.js
// LIVE COINBASE PIPELINE — PRODUCTION

const COINBASE_BASE = 'https://api.coinbase.com/v2/prices';

export async function getCryptoPrices(symbols = []) {
  const results = [];

  for (const symbol of symbols) {
    try {
      const res = await fetch(`${COINBASE_BASE}/${symbol}/spot`);
      const json = await res.json();

      results.push({
        symbol,
        price: Number(json.data.amount),
        source: 'coinbase',
      });
    } catch (e) {
      results.push({
        symbol,
        price: null,
        source: 'coinbase-error',
      });
    }
  }

  return results;
}

