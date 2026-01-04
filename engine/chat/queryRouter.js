/**
 * CHAT_QUERY_ROUTER_V1
 * -------------------
 * Intent classification for Chat Intelligence.
 * Engine-only. Deterministic. No side effects.
 */

export function routeChatQuery(query = "") {
  const q = String(query).toLowerCase();

  let intent = "MARKET";
  let engines = ["marketIntelligence"];
  let confidence = 0.6;

  const portfolioKeywords = [
    "portfolio",
    "holding",
    "allocation",
    "concentration",
    "exposure",
    "weight",
    "diversification",
  ];

  const marketKeywords = [
    "market",
    "macro",
    "rates",
    "inflation",
    "fed",
    "economy",
    "volatility",
    "trend",
    "crypto",
  ];

  const decisionKeywords = [
    "should",
    "do i",
    "what now",
    "rebalance",
    "buy",
    "sell",
    "add",
    "reduce",
  ];

  const hasPortfolio = portfolioKeywords.some(k => q.includes(k));
  const hasMarket = marketKeywords.some(k => q.includes(k));
  const hasDecision = decisionKeywords.some(k => q.includes(k));

  if (hasDecision && (hasPortfolio || hasMarket)) {
    intent = "MIXED";
    engines = ["decisionEngine"];
    confidence = 0.9;
  } else if (hasDecision) {
    intent = "DECISION";
    engines = ["decisionEngine"];
    confidence = 0.85;
  } else if (hasPortfolio) {
    intent = "PORTFOLIO";
    engines = ["portfolioAuthority"];
    confidence = 0.8;
  } else if (hasMarket) {
    intent = "MARKET";
    engines = ["marketIntelligence"];
    confidence = 0.75;
  }

  return {
    contract: "CHAT_QUERY_ROUTER_V1",
    intent,
    engines,
    confidence,
    timestamp: Date.now(),
  };
}
