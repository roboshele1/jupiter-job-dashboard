// renderer/chat/interpretationEnrichment.js
// Phase 3 Semantic Enrichment Layer
// Adds human-readable context to interpretation
// Still read-only, no inference, no actions

export function enrichInterpretation(interpretation) {
  const insights = [];
  const riskNotes = [];

  if (!interpretation.snapshot.available) {
    insights.push("Portfolio snapshot is not yet finalized.");
  }

  if (interpretation.portfolio.totalValue) {
    insights.push(
      `Total portfolio value is ${interpretation.portfolio.totalValue.toLocaleString()}.`
    );
  } else {
    insights.push("Total portfolio value is not yet computed.");
  }

  if (interpretation.allocation.summary) {
    insights.push("Asset allocation data is available.");
  } else {
    riskNotes.push("Allocation breakdown is missing.");
  }

  if (interpretation.holdings.top?.length > 0) {
    insights.push(
      `Top holdings include ${interpretation.holdings.top
        .map(h => h.symbol)
        .join(", ")}.`
    );
  } else {
    riskNotes.push("Top holdings are not hydrated.");
  }

  return {
    summary:
      "Chat is observing portfolio state using a read-only interpretation pipeline.",
    insights,
    riskNotes,
    system: interpretation.system
  };
}

