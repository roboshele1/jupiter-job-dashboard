// engine/api/marketDataServer.js
// Purpose: expose LIVE market prices to Vite via HTTP (NO MOCKS)

const express = require("express");
const bodyParser = require("body-parser");

const {
  getCryptoPrices,
  getEquityPrices,
} = require("../marketDataService");

const app = express();
app.use(bodyParser.json());

app.post("/market-data", async (req, res) => {
  try {
    const { symbols = [] } = req.body;

    if (!Array.isArray(symbols) || symbols.length === 0) {
      return res.status(400).json({ error: "No symbols provided" });
    }

    // Split symbols
    const crypto = [];
    const equities = [];

    for (const s of symbols) {
      if (s.endsWith("-USD")) {
        crypto.push(s.replace("-USD", ""));
      } else {
        equities.push(s);
      }
    }

    const prices = {};

    if (crypto.length) {
      Object.assign(prices, await getCryptoPrices(crypto));
    }

    if (equities.length) {
      Object.assign(prices, await getEquityPrices(equities));
    }

    res.json({ prices });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: err.message || "Market data fetch failed",
    });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Market data server listening on ${PORT}`);
});

