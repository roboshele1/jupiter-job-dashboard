import { registerPortfolioIpc } from "./portfolioIpc.js";
import { registerMarketIpc } from "./marketIpc.js";
import { registerPricesIpc } from "./pricesIpc.js";

export function registerAllIpc() {
  registerPortfolioIpc();
  registerMarketIpc();
  registerPricesIpc();
}

