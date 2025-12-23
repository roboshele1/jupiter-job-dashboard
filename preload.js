const { contextBridge } = require("electron");
const fetch = require("node-fetch");

async function fetchCoinbase(pair) {
  const res = await fetch(`https://api.coinbase.com/v2/prices/${pair}/spot`);
  const json = await res.json();
  return Number(json.data.amount);
}

contextBridge.exposeInMainWorld("prices", {
  getCryptoPrices: async () => {
    return {
      BTC: await fetchCoinbase("BTC-USD"),
      ETH: await fetchCoinbase("ETH-USD")
    };
  }
});

