/**
 * FUNDAMENTAL EXPLANATION — D10.3d (V2)
 * ------------------------------------
 * Differentiated, institution-grade explanation of business fundamentals.
 * Uses normalized factor inputs only.
 * Read-only. Deterministic. No advice. No new metrics.
 */

function explainFundamentalContext(fundamentals) {
  if (!fundamentals || typeof fundamentals !== "object") {
    throw new Error("INVALID_INPUT: fundamentals object required");
  }

  const factors = fundamentals.factors || {};
  const lines = [];

  /* =============================
     GROWTH CONTEXT
  ============================== */
  if (factors.growth >= 0.7) {
    lines.push(
      "Revenue and earnings trends indicate sustained growth with clear acceleration, supporting long-term expansion assumptions."
    );
  } else if (factors.growth >= 0.4) {
    lines.push(
      "Growth remains positive but shows signs of normalization rather than rapid acceleration."
    );
  } else {
    lines.push(
      "Growth trends are inconsistent or slowing, reducing confidence in near- to medium-term expansion."
    );
  }

  /* =============================
     QUALITY CONTEXT
  ============================== */
  if (factors.quality >= 0.7) {
    lines.push(
      "Profitability metrics and capital efficiency suggest the business converts revenue into durable economic value."
    );
  } else if (factors.quality >= 0.4) {
    lines.push(
      "Profitability is present but uneven, indicating execution quality that is adequate rather than exceptional."
    );
  } else {
    lines.push(
      "Weak profitability signals structural or competitive pressures impacting business quality."
    );
  }

  /* =============================
     CASH GENERATION CONTEXT
  ============================== */
  if (factors.cash >= 0.7) {
    lines.push(
      "Cash generation is strong, providing flexibility for reinvestment, resilience, or shareholder returns."
    );
  } else if (factors.cash >= 0.4) {
    lines.push(
      "Cash generation is sufficient but leaves limited margin for strategic missteps or external shocks."
    );
  } else {
    lines.push(
      "Cash flow generation is constrained, increasing reliance on external financing or balance sheet strength."
    );
  }

  /* =============================
     BALANCE SHEET CONTEXT
  ============================== */
  if (factors.balance >= 0.7) {
    lines.push(
      "The balance sheet is conservatively positioned, reducing financial risk during adverse conditions."
    );
  } else if (factors.balance >= 0.4) {
    lines.push(
      "Leverage is present but manageable, requiring continued discipline to avoid risk escalation."
    );
  } else {
    lines.push(
      "Elevated leverage or weak reserves increase sensitivity to earnings volatility or tightening credit conditions."
    );
  }

  return Object.freeze({
    summary:
      "Business fundamentals were evaluated across growth, profitability, cash generation, and balance sheet resilience.",
    details: Object.freeze(lines),
    disclaimer:
      "This explanation reflects historical financial performance and structural characteristics only. It does not predict future outcomes.",
  });
}

module.exports = Object.freeze({
  explainFundamentalContext,
});
