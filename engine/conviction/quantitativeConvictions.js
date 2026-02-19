/**
 * quantitativeConvictions.js
 * Pure math signals — no hardcoded opinions.
 * Derives confidence and conviction from live price data only.
 *
 * Signal inputs (all from Polygon prev-day OHLCV):
 *   - Momentum:   (close - open) / open
 *   - Range:      (high - low) / close  — volatility proxy
 *   - Volume:     raw volume (relative signal only)
 *
 * Output per symbol:
 *   confidence:  'BUY_MORE' | 'BUY' | 'HOLD' | 'AVOID'
 *   conviction:  0.0 – 1.0  (continuous score)
 *   rationale:   plain English derivation (no opinion, just math)
 */

import axios from 'axios';

const POLYGON_KEY = process.env.POLYGON_API_KEY
  || process.env.VITE_POLYGON_API_KEY
  || process.env.POLYGON_KEY
  || 'jyA2YblY5AP7pkvNtyBhpfTNQcSczcAS';

// ── Fetch prev-day OHLCV for a symbol ────────────────────────────────────────
async function fetchOHLCV(symbol) {
  try {
    // Polygon uses different endpoints for crypto vs equities
    const isCrypto = ['BTC', 'ETH'].includes(symbol.toUpperCase());
    let url;

    if (isCrypto) {
      const ticker = `X:${symbol.toUpperCase()}USD`;
      url = `https://api.polygon.io/v2/aggs/ticker/${ticker}/prev?adjusted=true&apiKey=${POLYGON_KEY}`;
    } else {
      url = `https://api.polygon.io/v2/aggs/ticker/${symbol.toUpperCase()}/prev?adjusted=true&apiKey=${POLYGON_KEY}`;
    }

    const resp = await axios.get(url, { timeout: 8000 });
    const r = resp.data?.results?.[0];
    if (!r) return null;
    return { open: r.o, high: r.h, low: r.l, close: r.c, volume: r.v };
  } catch {
    return null;
  }
}

// ── Derive signal from OHLCV ──────────────────────────────────────────────────
function deriveSignal(ohlcv) {
  if (!ohlcv || !ohlcv.close || !ohlcv.open) {
    return { confidence: 'HOLD', conviction: 0.5, rationale: 'No price data — defaulting to neutral' };
  }

  const { open, high, low, close } = ohlcv;

  // Momentum: daily return
  const momentum = (close - open) / open;

  // Volatility: H-L spread as % of close
  const volatility = (high - low) / close;

  // Conviction score: momentum signal strength, dampened by volatility
  // Range: 0.0 – 1.0
  const rawConviction = Math.min(1.0, Math.max(0.0,
    0.5 + (momentum * 10) - (volatility * 2)
  ));

  // Confidence tier derived purely from momentum
  let confidence;
  if (momentum > 0.025)       confidence = 'BUY_MORE';
  else if (momentum > 0.005)  confidence = 'BUY';
  else if (momentum > -0.015) confidence = 'HOLD';
  else                        confidence = 'AVOID';

  // Rationale is descriptive math, not opinion
  const mPct   = (momentum * 100).toFixed(2);
  const vPct   = (volatility * 100).toFixed(2);
  const rationale = `Daily momentum: ${mPct >= 0 ? '+' : ''}${mPct}% · H-L range: ${vPct}% · Conviction: ${(rawConviction * 100).toFixed(0)}/100`;

  return {
    confidence,
    conviction: Number(rawConviction.toFixed(3)),
    rationale
  };
}

// ── Main export: compute convictions for a list of symbols ───────────────────
export async function computeQuantitativeConvictions(symbols = []) {
  const results = {};

  await Promise.all(symbols.map(async (symbol) => {
    const ohlcv  = await fetchOHLCV(symbol);
    results[symbol] = deriveSignal(ohlcv);
  }));

  return results;
}

// ── Fallback neutral conviction (used if fetch fails entirely) ────────────────
export function neutralConviction(symbol) {
  return {
    confidence: 'HOLD',
    conviction: 0.5,
    rationale:  `${symbol}: price data unavailable — neutral signal`
  };
}
