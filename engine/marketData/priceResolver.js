/**
 * engine/marketData/priceResolver.js
 *
 * Read-only price enrichment layer.
 * - DOES NOT mutate holdings
 * - DOES NOT alter snapshots
 * - Safe for Dashboard / Portfolio / Signals
 *
 * Returns:
 * {
 *   [symbol]: { price, timestamp, source }
 * }
 */

const POLYGON_BASE = 'https://api.polygon.io';

function requireEnv() {
  if (!process.env.POLYGON_API_KEY) {
    throw new Error('POLYGON_API_KEY is not set');
  }
}

async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Polygon error ${res.status}: ${txt}`);
  }
  return res.json();
}

async function fetchEquityPrevClose(symbol) {
  try {
    const url =
      `${POLYGON_BASE}/v2/aggs/ticker/${symbol}/prev` +
      `?adjusted=true&apiKey=${process.env.POLYGON_API_KEY}`;

    const j = await fetchJSON(url);
    const bar = j?.results?.[0];

    if (!bar?.c) return null;

    return {
      price: bar.c,
      timestamp: bar.t,
      source: 'polygon-prev',
    };
  } catch {
    return null;
  }
}

async function fetchBTC() {
  try {
    const url =
      `${POLYGON_BASE}/v2/last/trade/X:BTCUSD` +
      `?apiKey=${process.env.POLYGON_API_KEY}`;

    const j = await fetchJSON(url);

    if (!j?.results?.p) return null;

    return {
      price: j.results.p,
      timestamp: j.results.t,
      source: 'polygon',
    };
  } catch {
    return null;
  }
}

/**
 * Tier-safe resolver
 * - Equities → aggs/prev (allowed on lower tiers)
 * - BTC → last trade
 */
export async function resolveLatestPrices(symbols = []) {
  requireEnv();

  const out = {};
  const uniq = [...new Set(symbols)].filter(Boolean);

  const equities = uniq.filter(s => s !== 'BTC');
  const hasBTC = uniq.includes('BTC');

  await Promise.all(
    equities.map(async symbol => {
      const data = await fetchEquityPrevClose(symbol);
      if (data) out[symbol] = data;
    })
  );

  if (hasBTC) {
    const btc = await fetchBTC();
    if (btc) out['BTC'] = btc;
  }

  return out;
}

