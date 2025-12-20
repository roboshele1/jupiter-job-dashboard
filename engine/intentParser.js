function parseIntent(text) {
  const t = text.toLowerCase();

  if (t.includes("make") && t.includes("months")) {
    return { type: "growth_projection" };
  }

  if (t.includes("allocate") || t.includes("put in")) {
    return { type: "allocation_query" };
  }

  if (t.includes("risk")) {
    return { type: "risk_assessment" };
  }

  return { type: "unknown" };
}

module.exports = {
  parseIntent,
};

