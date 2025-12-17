const https = require("https");

/**
 * Fetch spot price from Coinbase
 */
function fetchCoinbasePrice(symbol) {
  const pair = `${symbol}-USD`;
  const url = `https://api.coinbase.com/v2/prices/${pair}/spot`;

  return new Promise((resolve) => {
    https
      .get(url, (res) => {
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => {
          try {
            const json = JSON.parse(data);
            const price = parseFloat(json?.data?.amount);
            resolve(isNaN(price) ? null : price);
          } catch {
            resolve(null);
          }
        });
      })
      .on("error", () => resolve(null));
  });
}

/**
 * Canonical crypto snapshot
 */
async function getCryptoSnapshot() {
  const holdings = [
    { symbol: "BTC", amount: 0.251083 },
    { symbol: "ETH", amount: 0.25 }
  ];

  let totalMarketValue = 0;

  for (const h of holdings) {
    const price = await fetchCoinbasePrice(h.symbol);
    h.price = price;
    h.marketValue =
      price !== null ? +(h.amount * price).toFixed(2) : null;

    if (h.marketValue !== null) totalMarketValue += h.marketValue;
  }

  return {
    asOf: new Date().toISOString(),
    holdings,
    totalMarketValue: +totalMarketValue.toFixed(2)
  };
}

/**
 * 🔒 PORTFOLIO ENGINE CONTRACT
 * Returns array ONLY — never undefined
 */
async function getCryptoHoldings() {
  const snapshot = await getCryptoSnapshot();
  return Array.isArray(snapshot.holdings) ? snapshot.holdings : [];
}

module.exports = {
  getCryptoSnapshot,
  getCryptoHoldings
};

