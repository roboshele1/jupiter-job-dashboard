// engine/market/marketSnapshotService.js

import { getCryptoPrices } from "../pricing/cryptoPriceService.js";

export async function getMarketSnapshot() {
  const cryptoSymbols = ["BTC-USD", "ETH-USD"];
  const crypto = await getCryptoPrices(cryptoSymbols);

  return {
    crypto,
  };
}

