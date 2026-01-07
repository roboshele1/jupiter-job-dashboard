/**
 * FUNDAMENTAL EXPLANATION — D10.3c
 * --------------------------------
 * Plain-English explanation of business fundamentals.
 * Read-only. Deterministic. No advice.
 */

function explainFundamentalContext(fundamentals) {
  if (!fundamentals || typeof fundamentals !== "object") {
    throw new Error("INVALID_INPUT: fundamentals object required");
  }

  const factors = fundamentals.factors || {};

  const lines = [];

  if (factors.growth >= 0.7) {
    lines.push("The company shows strong growth based on revenue and earnings trends.");
  } else if (factors.growth >= 0.4) {
    lines.push("The company shows moderate growth without strong acceleration.");
  } else {
    lines.push("The company shows weak or inconsistent growth.");
  }

  if (factors.quality >= 0.7) {
    lines.push("Profitability and capital efficiency appear strong.");
  } else if (factors.quality >= 0.4) {
    lines.push("Profitability is acceptable but not outstanding.");
  } else {
    lines.push("Profitability metrics indicate potential weakness.");
  }

  if (factors.cash >= 0.7) {
    lines.push("Cash generation is healthy and reliable.");
  } else if (factors.cash >= 0.4) {
    lines.push("Cash generation is adequate but not robust.");
  } else {
    lines.push("Cash flow strength appears limited.");
  }

  if (factors.balance >= 0.7) {
    lines.push("The balance sheet is strong with manageable debt.");
  } else if (factors.balance >= 0.4) {
    lines.push("The balance sheet is reasonable with some leverage.");
  } else {
    lines.push("Balance sheet risk is elevated due to leverage or weak reserves.");
  }

  return Object.freeze({
    summary:
      "Business fundamentals were reviewed to assess strength, durability, and financial quality.",
    details: Object.freeze(lines),
    disclaimer:
      "This explanation reflects historical business performance only. It does not predict future results.",
  });
}

module.exports = Object.freeze({
  explainFundamentalContext,
});
