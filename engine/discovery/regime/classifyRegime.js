/**
 * DISCOVERY LAB — ECONOMIC REGIME CLASSIFIER (CANONICAL)
 * -----------------------------------------------------
 * Outputs STRICT, ENUM-SAFE regime labels for downstream engines
 *
 * IMPORTANT:
 * - `label` is MACHINE-CANONICAL (used by scoring engines)
 * - `display` is HUMAN-READABLE (used by explanations/UI)
 * - No ambiguity allowed
 */

const REGIME_MAP = Object.freeze([
  {
    match: () => true, // default until macro signals wired
    label: "TIGHT_MONETARY",
    display: "Tight Monetary",
    assumption:
      "Interest rates are elevated and liquidity conditions are restrictive.",
  },
]);

function classifyRegime(_macroInput = {}) {
  const regime = REGIME_MAP.find(r => r.match());

  if (!regime) {
    throw new Error("REGIME_CLASSIFICATION_FAILED");
  }

  return Object.freeze({
    label: regime.label,       // 👈 MACHINE SAFE
    display: regime.display,   // 👈 HUMAN SAFE
    assumption: regime.assumption,
  });
}

module.exports = Object.freeze({
  classifyRegime,
});
