import axios from 'axios';

/**
 * Renderer-only crypto price fetcher
 * Mirrors equities pricing model (NO IPC)
 */
export async function getCryptoQuote(symbol) {
  try {
    const pair = `${symbol}-USD`;
    const res = await axios.get(
      `https://api.coinbase.com/v2/prices/${pair}/spot`
    );

    console.log('[CRYPTO RAW]', symbol, res.data);

    const price = parseFloat(res.data.data.amount);

    return {
      symbol,
      price,
      change: 0,
      plPercent: 0
    };
  } catch (e) {
    console.error('Crypto price error:', symbol, e);
    return {
      symbol,
      price: 0,
      change: 0,
      plPercent: 0
    };
  }
}

