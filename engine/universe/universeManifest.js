/**
 * Universe Manifest — Canonical
 * ----------------------------------------
 * Authoritative symbol universe for Moonshot scans.
 *
 * HARD RULES:
 * - Data only (no logic)
 * - Deterministic
 * - Versionable
 * - No dependency on portfolio, watchlist, or discovery
 *
 * NOTE:
 * Phase 1 = static broad-market coverage
 * Phase 2 = dynamic expansion (indices, exchanges, filters)
 */

module.exports = Object.freeze({
  version: "UNIVERSE_V1_STATIC_BROAD",

  description:
    "Broad unconstrained equity universe: S&P 500 + NASDAQ large/mid + TSX large/mid (starter set)",

  exchanges: ["NYSE", "NASDAQ", "TSX"],

  symbols: [
    // --- US MEGA / LARGE CAP (sample, expandable) ---
    "AAPL", "MSFT", "NVDA", "AMZN", "GOOGL", "META", "TSLA",
    "AVGO", "AMD", "INTC", "ORCL", "CRM", "ADBE", "QCOM",
    "NFLX", "CSCO", "IBM", "MU", "TXN", "AMAT",

    // --- US GROWTH / MID ---
    "PLTR", "SNOW", "CRWD", "NET", "DDOG", "MDB", "COIN",
    "RBLX", "U", "SHOP", "SQ", "PYPL", "HOOD",

    // --- BIOTECH / OPTIONALITY ---
    "MRNA", "BNTX", "BEAM", "CRSP", "NTLA", "EDIT",

    // --- ENERGY / MATERIALS ---
    "XOM", "CVX", "SLB", "COP", "OXY",

    // --- CANADA (TSX) ---
    "SHOP.TO", "CNQ.TO", "ENB.TO", "SU.TO", "TD.TO",
    "RY.TO", "BNS.TO", "BAM.TO", "CP.TO", "CNR.TO",

    // --- OPTIONAL / HIGH BETA ---
    "MSTR", "RIOT", "MARA", "BITF", "HUT"
  ]
});
