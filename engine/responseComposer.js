function composeResponse(intent, meta) {
  switch (intent.type) {
    case "growth_projection":
      return {
        type: "projection",
        message: "Growth trajectory modeled under conservative assumptions.",
        confidence: meta.confidence,
      };

    case "allocation_query":
      return {
        type: "allocation",
        message: "Allocation impact computed without execution.",
        confidence: meta.confidence,
      };

    case "risk_assessment":
      return {
        type: "risk",
        message: "Risk exposure evaluated against thresholds.",
        confidence: meta.confidence,
      };

    default:
      return {
        type: "unknown",
        message: "Intent recognized but no execution path available.",
        confidence: meta.confidence,
      };
  }
}

module.exports = {
  composeResponse,
};

