/**
 * JUPITER — Canonical Holdings Authority (V1)
 * Single source of truth for ALL portfolio positions
 * Equities + Crypto enforced
 * DO NOT compute prices or allocation here
 */

module.exports = [
  // ─── EQUITIES ──────────────────────────────────────────────
  { symbol: "NVDA", qty: 73 },
  { symbol: "AVGO", qty: 74 },
  { symbol: "ASML", qty: 10 },
  { symbol: "MSTR", qty: 24 },
  { symbol: "HOOD", qty: 70 },
  { symbol: "APLD", qty: 150 },
  { symbol: "BMNR", qty: 115 },

  // ─── CRYPTO (CANONICAL, ENFORCED) ───────────────────────────
  { symbol: "BTC", qty: 0.251 },
  { symbol: "ETH", qty: 0.25 }
];

