import fetch from 'node-fetch';

const POLYGON_KEY = process.env.POLYGON_API_KEY || "jyA2YblY5AP7pkvNtyBhpfTNQcSczcAS";

async function fetchWithRetry(url, retries = 2) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, { timeout: 5000 });
      if (res.ok) return await res.json();
    } catch (e) {
      if (i === retries - 1) return null;
      await new Promise(r => setTimeout(r, Math.pow(2, i) * 1000));
    }
  }
  return null;
}

export async function detectOptionsFlow(symbol) {
  try {
    const data = await fetchWithRetry(
      `https://api.polygon.io/v3/snapshot/options/chains/${symbol}?apiKey=${POLYGON_KEY}`
    );
    
    if (!data || !data.results) {
      return { callPutRatio: 1, impliedVolatility: 0.3, signal: 'NO_DATA', strength: 0 };
    }
    
    const results = data.results;
    const calls = results.filter(o => o.details?.contract_type === 'call');
    const puts = results.filter(o => o.details?.contract_type === 'put');
    
    const callVol = calls.reduce((s, c) => s + (c.last_quote?.ask_size || 0), 0);
    const putVol = puts.reduce((s, p) => s + (p.last_quote?.ask_size || 0), 0);
    const ratio = callVol / Math.max(putVol, 1);
    const iv = calls.reduce((s, c) => s + (c.details?.option_details?.implied_volatility || 0.3), 0) / Math.max(calls.length, 1);
    
    let signal = 'NEUTRAL';
    if (ratio > 1.8 && iv > 0.5) signal = 'BULLISH_ACCUMULATION';
    else if (ratio > 1.5) signal = 'CALL_BUYING';
    else if (ratio < 0.8) signal = 'PUT_HEDGING';
    
    return { symbol, callPutRatio: ratio.toFixed(2), impliedVolatility: (iv * 100).toFixed(1), signal, strength: Math.min(ratio * iv, 1) };
  } catch (err) {
    return { symbol, callPutRatio: 1, impliedVolatility: 30, signal: 'ERROR', strength: 0, error: err.message };
  }
}
