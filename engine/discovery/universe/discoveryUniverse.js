/**
 * Discovery Universe — Dynamic Market Feed
 * No hardcoded symbols. Jupiter builds its own universe from live market data.
 *
 * Strategy:
 *   1. Pull grouped daily snapshot from Polygon (entire US market, one call)
 *   2. Filter by minimum liquidity (price > $5, volume > 500k)
 *   3. Rank by absolute momentum (biggest movers surface first)
 *   4. Always include your actual holdings regardless of filters
 */

import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const POLYGON_KEY = process.env.POLYGON_API_KEY
  || process.env.VITE_POLYGON_API_KEY
  || process.env.POLYGON_KEY
  || 'jyA2YblY5AP7pkvNtyBhpfTNQcSczcAS';

const UNIVERSE_SIZE = 100; // top external movers to include alongside holdings
const MIN_PRICE     = 5;
const MIN_VOLUME    = 500_000;

function loadHoldingSymbols() {
  try {
    const p = path.resolve(__dirname, '../../../engine/data/users/default/holdings.json');
    return JSON.parse(fs.readFileSync(p, 'utf-8')).map(h => h.symbol?.toUpperCase()).filter(Boolean);
  } catch {
    return [];
  }
}

async function fetchGroupedDaily() {
  try {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    if (d.getDay() === 0) d.setDate(d.getDate() - 2);
    if (d.getDay() === 6) d.setDate(d.getDate() - 1);
    const date = d.toISOString().split('T')[0];
    const url  = `https://api.polygon.io/v2/aggs/grouped/locale/us/market/stocks/${date}?adjusted=true&apiKey=${POLYGON_KEY}`;
    const resp = await axios.get(url, { timeout: 15000 });
    return resp.data?.results || [];
  } catch (err) {
    console.error('[DiscoveryUniverse] Grouped daily fetch failed:', err.message);
    return [];
  }
}

export async function buildDiscoveryUniverse() {
  const holdingSymbols = loadHoldingSymbols();
  const allTickers     = await fetchGroupedDaily();

  if (!allTickers.length) {
    console.warn('[DiscoveryUniverse] No market data — using holdings only');
    return holdingSymbols.map(symbol => ({ symbol, ownership: true, momentum: 0 }));
  }

  const liquid = allTickers.filter(t =>
    t.c >= MIN_PRICE &&
    t.v >= MIN_VOLUME &&
    t.T &&
    !t.T.includes('.') &&
    t.T.length <= 5
  );

  const scored = liquid.map(t => ({
    symbol:    t.T,
    momentum:  t.o > 0 ? (t.c - t.o) / t.o : 0,
    volume:    t.v,
    price:     t.c,
    ownership: holdingSymbols.includes(t.T)
  }));

  scored.sort((a, b) => Math.abs(b.momentum) - Math.abs(a.momentum));

  const topExternal = scored
    .filter(t => !holdingSymbols.includes(t.symbol))
    .slice(0, UNIVERSE_SIZE);

  const holdingEntries = holdingSymbols.map(symbol => {
    const match = scored.find(t => t.symbol === symbol);
    return match || { symbol, ownership: true, momentum: 0, volume: 0, price: 0 };
  });

  const universe = [...holdingEntries, ...topExternal];
  console.log(`[DiscoveryUniverse] ${holdingEntries.length} holdings + ${topExternal.length} market candidates = ${universe.length} total`);
  return universe;
}

export function getDiscoveryUniverse() {
  return loadHoldingSymbols().map(symbol => ({ symbol, ownership: true }));
}

export default { buildDiscoveryUniverse, getDiscoveryUniverse };
