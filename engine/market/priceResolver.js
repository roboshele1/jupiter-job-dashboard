/**
 * engine/market/priceResolver.js
 * Terminal-safe unified price resolver
 */

import { getCryptoPrices } from "./live/cryptoLiveFeed.js";
import { getEquityPrices } from "./live/equityLiveFeed.js";

export async function resolvePrice(holding) {
  const now = Date.now();

  if (holding.assetClass === "crypto") {
    const crypto = await getCryptoPrices();
    const q = crypto[holding.symbol];
    return q
      ? { price: q.price, source: q.source, timestamp: now }
      : { price: 0, source: "crypto-missing", timestamp: now };
  }

  if (holding.assetClass === "equity") {
    const equities = await getEquityPrices();
    const q = equities[holding.symbol];
    return q
      ? { price: q.price, source: q.source, timestamp: now }
      : { price: 0, source: "equity-missing", timestamp: now };
  }

  return { price: 0, source: "unknown-asset", timestamp: now };
}

