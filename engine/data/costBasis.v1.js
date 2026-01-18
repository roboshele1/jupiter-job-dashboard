/**
 * Cost Basis Authority — V1
 * ---------------------------------------------
 * Engine-only, read-only cost basis data.
 *
 * - Currency: CAD
 * - Values represent TOTAL book cost per asset
 * - No mutation logic
 * - No UI, IPC, or valuation coupling
 * - Not referenced yet (authority only)
 *
 * This file is intentionally isolated.
 * Composition with holdings quantity will occur
 * in a future snapshot phase.
 */

const COST_BASIS_V1 = Object.freeze({
  currency: "CAD",
  version: "v1",
  totals: Object.freeze({
    NVDA: 12881.13,
    ASML: 8649.52,
    AVGO: 26190.68,
    MSTR: 13398.29,
    HOOD: 3316.68,
    BMNR: 6320.18,
    APLD: 1693.41,
    BTC: 24764.31,
    ETH: 597.90,
  }),
});

module.exports = COST_BASIS_V1;

