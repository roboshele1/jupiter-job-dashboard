/**
 * CHAT_INTELLIGENCE_V1
 * -------------------
 * Executes routed engines and synthesizes a unified response.
 * Engine-only. Deterministic. Read-only.
 */

import { routeChatQuery } from "./queryRouter.js";
import { getGlobalMarketIntelligence } from "../market/marketIntelligence.js";
import { getAuthoritativePortfolio } from "../portfolio/portfolioAuthority.js";
import { runDecisionEngine } from "../decision/decisionEngine.js";

/* ============================
   PHASE 6.9 — MEMORY APPEND
   ============================ */
import {
  recordChatIntelligence,
  detectSynthesisDrift,
} from "./chatMemoryStore.js";

export async function runChatIntelligence(query = "") {
  const routing = routeChatQuery(query);

  let market = null;
  let portfolio = null;
  let decision = null;

  for (const engine of routing.engines) {
    if (engine === "marketIntelligence") {
      market = getGlobalMarketIntelligence();
    }

    if (engine === "portfolioAuthority") {
      portfolio = await getAuthoritativePortfolio();
    }

    if (engine === "decisionEngine") {
      decision = await runDecisionEngine({ query });
    }
  }

  const summaryParts = [];
  const perspectives = [];

  /* =========================================================
     BASE SUMMARIES (EXISTING)
     ========================================================= */

  if (market) {
    summaryParts.push(
      `Market regime is ${market.regime.state} with ${(market.regime.confidence * 100).toFixed(0)}% confidence.`
    );

    perspectives.push({
      source: "market",
      stance: market.regime.state,
      confidence: market.regime.confidence,
    });
  }

  if (portfolio) {
    summaryParts.push(
      `Your portfolio holds ${portfolio.holdings.length} positions with ${portfolio.currency} exposure.`
    );

    perspectives.push({
      source: "portfolio",
      stance: "CURRENT_EXPOSURE",
      concentration: portfolio.holdings[0]?.symbol || null,
    });
  }

  if (decision) {
    summaryParts.push(
      `Decision posture is ${decision.assessment.posture} under a ${decision.assessment.regime} regime.`
    );

    perspectives.push({
      source: "decision",
      posture: decision.assessment.posture,
      regime: decision.assessment.regime,
      confidence: decision.assessment.confidence,
    });
  }

  /* =========================================================
     INTENT-DRIVEN LOGIC (PHASE 6.6)
     ========================================================= */

  if (routing.intent === "PORTFOLIO" && portfolio) {
    const top = portfolio.holdings[0];
    summaryParts.push(
      `Largest position is ${top.symbol}, contributing meaningfully to portfolio concentration.`
    );
  }

  if (routing.intent === "MARKET" && market) {
    summaryParts.push(
      `Macro conditions currently favor ${market.implications.favoredAssets.join(", ")} assets.`
    );
  }

  if (routing.intent === "DECISION" && decision) {
    summaryParts.push(
      `Recommended posture is ${decision.assessment.posture}, reflecting current risk conditions.`
    );
  }

  if (routing.intent === "MIXED" && market && decision) {
    summaryParts.push(
      `Market context and portfolio posture are aligned under a ${decision.assessment.regime} regime.`
    );
  }

  /* =========================================================
     MULTI-ENGINE SYNTHESIS (PHASE 6.7)
     ========================================================= */

  let synthesisState = "NEUTRAL";

  if (market && decision) {
    synthesisState =
      market.regime.state === "RISK_ON" &&
      decision.assessment.posture === "ALLOW_GROWTH"
        ? "ALIGNED"
        : "DIVERGENT";
  }

  if (synthesisState === "DIVERGENT") {
    summaryParts.push(
      "Engines are not fully aligned; multiple valid interpretations exist under current conditions."
    );
  }

  if (synthesisState === "ALIGNED") {
    summaryParts.push(
      "Independent engines converge on a consistent risk posture."
    );
  }

  /* =========================================================
     PHASE 6.9 — MEMORY RECORD + DRIFT DETECTION
     ========================================================= */

  recordChatIntelligence({
    intent: routing.intent,
    confidence: routing.confidence,
    synthesisState,
    sources: routing.engines,
  });

  const drift = detectSynthesisDrift();

  if (drift?.unstable) {
    summaryParts.push(
      "Recent intelligence shows regime interpretation variability across time."
    );
  }

  return {
    contract: "CHAT_INTELLIGENCE_V1",
    intent: routing.intent,
    confidence: routing.confidence,
    synthesisState,
    sources: routing.engines,
    perspectives,
    summary: summaryParts.slice(0, 5),
    diagnostics: {
      marketLoaded: !!market,
      portfolioLoaded: !!portfolio,
      decisionLoaded: !!decision,
      memoryDrift: drift || null,
    },
    timestamp: Date.now(),
  };
}
