/**
 * v1 deterministic price service
 * No async, no fetch — local prices only
 */

function getPrices() {
  return {
    NVDA: 505,
    AVGO: 1380,
    ASML: 915,
    MSTR: 980,
    HOOD: 19,
    APLD: 6.2,
    BMNR: 3.1,
    BTC: 43000
  };
}

module.exports = { getPrices };

