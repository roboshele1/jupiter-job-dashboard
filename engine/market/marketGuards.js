/**
 * marketGuards.js
 * Prevent silent degradation
 */

export function assertLiveEquity(priceObj) {
  if (priceObj.source !== "polygon-live") {
    throw new Error(
      `Equity price is not live: ${priceObj.symbol}`
    );
  }
}

