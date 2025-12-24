/**
 * engine/market/priceResolver.js
 * Authoritative live price resolver (CAD)
 * Currency is hard-locked to CAD
 */

import { getCryptoPrices } from "./live/cryptoLiveFeed.js";
import { getEquityPrices } from "./live/equityLiveFeed.js";

export async function resolvePrices(positions) {
  const crypto = await getCryptoPrices();   // CAD
  const equity = await getEquityPrices();   // CAD

  const out = {};

  for (const p of positions) {
    if (p.type === "crypto") {
      out[p.symbol] = {
        price: crypto[p.symbol]?.price ?? 0,
        source: crypto[p.symbol]?.source ?? "unknown",
        currency: "CAD"
      };
    }

    if (p.type === "equity") {
      out[p.symbol] = {
        price: equity[p.symbol]?.price ?? 0,
        source: equity[p.symbol]?.source ?? "unknown",
        currency: "CAD"
      };
    }
  }

  return out;
}

