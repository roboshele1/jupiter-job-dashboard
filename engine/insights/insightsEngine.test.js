import { computeInsights } from "./insightsEngine.js";

const mockSnapshot = {
  portfolio: {
    positions: [
      { symbol: "AVGO", assetClass: "equity", liveValue: 25500 },
      { symbol: "BTC", assetClass: "crypto", liveValue: 22700 },
      { symbol: "NVDA", assetClass: "equity", liveValue: 13500 },
      { symbol: "ASML", assetClass: "equity", liveValue: 12700 },
      { symbol: "HOOD", assetClass: "equity", liveValue: 8000 }
    ]
  }
};

const result = computeInsights(mockSnapshot);

console.log("Insights Engine Output:", result);

if (!result || typeof result !== "object") {
  throw new Error("No output returned from Insights Engine");
}

if (!result.riskPosture || !result.confidenceBand) {
  throw new Error("Missing required insight fields");
}

console.log("✅ Insights Engine test passed");
