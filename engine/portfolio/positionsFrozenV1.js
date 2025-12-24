/**
 * FROZEN POSITIONS CONTRACT V1
 * - Single source of truth for quantities + cost basis
 * - All costs normalized to USD
 */

export function getFrozenPositionsV1() {
  return [
    { symbol: 'BTC', quantity: 0.251083, costUSD: 24764.31 },
    { symbol: 'ETH', quantity: 0.25, costUSD: 436.11 },

    { symbol: 'NVDA', quantity: 73, costUSD: 12881.13 },
    { symbol: 'ASML', quantity: 10, costUSD: 8649.52 },
    { symbol: 'AVGO', quantity: 74, costUSD: 26190.68 },
    { symbol: 'MSTR', quantity: 24, costUSD: 12496.18 },
    { symbol: 'HOOD', quantity: 70, costUSD: 3316.68 },
    { symbol: 'BMNR', quantity: 115, costUSD: 6320.18 },
    { symbol: 'APLD', quantity: 150, costUSD: 1615.58 }
  ];
}

