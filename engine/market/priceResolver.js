/**
 * priceResolver.js
 * Authoritative pricing router
 */

import { fetchLiveEquityPrice } from "./live/equitiesLiveFeed.js";
import { fetchLiveCryptoPrice } from "./live/cryptoLiveFeed.js";

export async function resolvePrice(asset) {
  if (asset.type === "equity") {
    return await fetchLiveEquityPrice(asset.symbol);
  }

  if (asset.type === "digital") {
    return await fetchLiveCryptoPrice(asset.symbol);
  }

  return {
    symbol: asset.symbol,
    price: asset.price ?? 0,
    timestamp: Date.now(),
    source: "snapshot"
  };
}

