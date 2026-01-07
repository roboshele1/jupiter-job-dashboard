/**
 * D10.3d — Conviction & Confidence Explanation Layer
 * -------------------------------------------------
 * Purpose:
 * Translate Discovery conviction scores into plain-English
 * confidence explanations.
 *
 * This layer:
 * - Explains confidence, NOT actions
 * - Mirrors decision thresholds exactly
 * - Is deterministic and read-only
 * - Adds human clarity without altering logic
 */

function explainConvictionContext(input) {
  if (!input || typeof input !== "object") {
    throw new Error(
      "INVALID_INPUT: conviction explanation requires an input object"
    );
  }

  const { convictionScore, normalized, ownership = false } = input;

  if (typeof normalized !== "number") {
    throw new Error("MISSING_FIELDS: normalized conviction required");
  }

  let summary;
  const details = [];

  if (normalized >= 0.8) {
    summary =
      "Overall confidence is very high, with strengths clearly outweighing risks.";

    details.push(
      "The underlying data shows strong alignment across multiple evaluation dimensions."
    );

    if (ownership) {
      details.push(
        "Because this asset is already owned, conviction supports increasing exposure rather than initiating a new position."
      );
    }
  } else if (normalized >= 0.6) {
    summary =
      "Confidence is moderate, with meaningful strengths present alongside notable uncertainties.";

    details.push(
      "Positive characteristics are evident, but not dominant enough to justify high conviction."
    );
  } else if (normalized >= 0.4) {
    summary =
      "Confidence has weakened as risks begin to outweigh positive factors.";

    details.push(
      "Some strengths remain, but they are no longer sufficient to offset emerging concerns."
    );
  } else {
    summary =
      "Confidence is low, with risks materially outweighing strengths.";

    details.push(
      "Preserving capital takes precedence when conviction falls into this range."
    );
  }

  return Object.freeze({
    score: convictionScore ?? null,
    normalized,
    summary,
    details,
    disclaimer:
      "This confidence explanation reflects a mathematical assessment of available data. It does not recommend actions or predict outcomes.",
  });
}

module.exports = Object.freeze({
  explainConvictionContext,
});
