// engine/llm/chatExposureBuilder.js
// ---------------------------------
// Phase 17 — deterministic, schema-safe exposure builder
// Produces full narrative for all holdings

export function buildChatExposure(interpretation) {
  const concentration = interpretation?.portfolioSummary?.concentration || "N/A";
  const primaryDriver = interpretation?.riskSummary?.primaryDriver ?? "none";
  const growthAlignment = interpretation?.growthSummary?.alignment ?? "aligned";

  const headline = `Your portfolio is currently concentrated in ${concentration}.`;
  const context = `The primary risk driver identified is ${primaryDriver}. Overall growth alignment remains ${growthAlignment}.`;

  // Generate per-holding detailed insight blocks
  const holdings = (interpretation?.allocation?.top || []).map((h) => {
    return {
      symbol: h.symbol,
      note: `Holding ${h.symbol} contributes to overall portfolio concentration. Risk impact: ${primaryDriver}. Growth alignment: ${growthAlignment}.`
    };
  });

  return { headline, context, holdings };
}

