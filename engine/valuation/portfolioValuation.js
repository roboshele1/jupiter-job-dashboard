/**
 * portfolioValuation.js
 * Authoritative valuation engine
 * Live equities enabled
 */

import { resolvePrice } from "../market/priceResolver.js";
import { assertLiveEquity } from "../market/marketGuards.js";

export async function valuePortfolio(holdings) {
  const valued = [];

  for (const h of holdings) {
    const quote = await resolvePrice(h);

    if (h.type === "equity") {
      assertLiveEquity(quote);
    }

    valued.push({
      ...h,
      price: quote.price,
      value: h.quantity * quote.price,
      priceSource: quote.source,
      timestamp: quote.timestamp
    });
  }

  return valued;
}

