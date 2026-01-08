/**
 * EXECUTION_EXPOSURE_ENGINE_V1 (D12.9)
 * -----------------------------------
 * Purpose:
 * - Convert "confidence" into a READ-ONLY, SHADOW "execution exposure" descriptor.
 *
 * Rules:
 * - Deterministic
 * - No prices
 * - No orders
 * - No timing
 * - No recommendations
 * - Descriptive only (institution-grade risk discipline)
 */

const ALLOWED_CONFIDENCE = new Set(["AVOID", "HOLD", "BUY", "BUY_MORE"]);

function normalizeString(v, fallback = "UNKNOWN") {
  if (typeof v !== "string") return fallback;
  const s = v.trim();
  return s.length ? s : fallback;
}

function nowIso() {
  return new Date().toISOString();
}

function clampExposureLevel(level) {
  const allowed = new Set(["NONE", "OBSERVE", "LIGHT", "STANDARD", "AGGRESSIVE"]);
  return allowed.has(level) ? level : "NONE";
}

function buildConstraints({
  confidence,
  portfolioOverlay = {},
  regime = "UNKNOWN",
} = {}) {
  const constraints = [];

  const concentrationRisk = normalizeString(
    portfolioOverlay.concentrationRisk,
    "UNKNOWN"
  );
  const cryptoSensitivity = normalizeString(
    portfolioOverlay.cryptoSensitivity,
    "UNKNOWN"
  );

  // Core discipline constraints (institutional defaults)
  constraints.push("Read-only: no execution, no orders, no automation.");

  // Confidence-driven constraints
  if (confidence === "AVOID") {
    constraints.push("Exposure disabled while confidence is AVOID.");
  }

  if (confidence === "HOLD") {
    constraints.push("No new exposure implied; maintain observational posture.");
  }

  if (confidence === "BUY") {
    constraints.push("Escalation gated: requires confirmation logic before any upgrade.");
  }

  if (confidence === "BUY_MORE") {
    constraints.push("Escalation gated: requires multiple confirmations and stable regime.");
  }

  // Overlay constraints
  if (concentrationRisk === "HIGH") {
    constraints.push("Portfolio concentration risk HIGH: tighten exposure discipline.");
  } else if (concentrationRisk === "ELEVATED") {
    constraints.push("Portfolio concentration risk ELEVATED: prefer smaller increments.");
  }

  if (cryptoSensitivity === "HIGH") {
    constraints.push("Crypto sensitivity HIGH: avoid compounding correlated risk.");
  } else if (cryptoSensitivity === "SENSITIVE") {
    constraints.push("Crypto sensitivity SENSITIVE: cap incremental exposure.");
  }

  // Regime discipline (descriptive)
  const regimeLabel = normalizeString(regime, "UNKNOWN");
  constraints.push(`Regime context: ${regimeLabel} (descriptive only).`);

  return Object.freeze(constraints);
}

function buildChecklist(confidence) {
  const base = [
    "Verify confidence is stable across evaluations (no one-off jumps).",
    "Verify regime has not shifted materially (avoid regime-churn).",
    "Verify portfolio constraints (concentration/sector/crypto sensitivity).",
    "Verify rationale is present (why the confidence exists).",
    "Keep shadow mode until gates are explicitly satisfied.",
  ];

  if (confidence === "AVOID") {
    base.unshift("Do not expose execution: confidence is AVOID.");
  }

  if (confidence === "HOLD") {
    base.unshift("Observation only: HOLD does not imply new exposure.");
  }

  if (confidence === "BUY" || confidence === "BUY_MORE") {
    base.unshift("No execution implied: this is exposure description only.");
  }

  return Object.freeze(base);
}

function deriveExposureLevel(confidence, portfolioOverlay = {}) {
  const concentrationRisk = normalizeString(
    portfolioOverlay.concentrationRisk,
    "UNKNOWN"
  );

  // Deterministic mapping (descriptive)
  // NOTE: This does not instruct action; it labels theoretical exposure posture.
  let level = "NONE";

  if (confidence === "AVOID") level = "NONE";
  if (confidence === "HOLD") level = "OBSERVE";
  if (confidence === "BUY") level = "STANDARD";
  if (confidence === "BUY_MORE") level = "AGGRESSIVE";

  // Tighten if portfolio is already highly concentrated
  if (level === "AGGRESSIVE" && concentrationRisk === "HIGH") {
    level = "STANDARD";
  }
  if (level === "STANDARD" && concentrationRisk === "HIGH") {
    level = "LIGHT";
  }

  return clampExposureLevel(level);
}

/**
 * evaluateExecutionExposure
 * ------------------------
 * Inputs:
 * - symbol: string
 * - confidence: AVOID | HOLD | BUY | BUY_MORE
 * - portfolioOverlay: { concentrationRisk?: string, cryptoSensitivity?: string }
 * - regime: string
 *
 * Output:
 * - Deterministic descriptive object (shadow mode)
 */
function evaluateExecutionExposure(input = {}) {
  const symbol = normalizeString(input.symbol, "UNKNOWN");
  const confidence = normalizeString(input.confidence, "AVOID").toUpperCase();

  if (!ALLOWED_CONFIDENCE.has(confidence)) {
    throw new Error("EXECUTION_EXPOSURE_INVALID_CONFIDENCE");
  }

  const portfolioOverlay =
    input.portfolioOverlay && typeof input.portfolioOverlay === "object"
      ? input.portfolioOverlay
      : {};

  const regime = normalizeString(input.regime, "UNKNOWN");

  const exposureLevel = deriveExposureLevel(confidence, portfolioOverlay);
  const constraints = buildConstraints({ confidence, portfolioOverlay, regime });
  const checklist = buildChecklist(confidence);

  return Object.freeze({
    metadata: Object.freeze({
      contract: "EXECUTION_EXPOSURE_V1",
      mode: "SHADOW",
      generatedAt: nowIso(),
    }),
    symbol,
    inputs: Object.freeze({
      confidence,
      regime,
      portfolioOverlay: Object.freeze({
        concentrationRisk: normalizeString(
          portfolioOverlay.concentrationRisk,
          "UNKNOWN"
        ),
        cryptoSensitivity: normalizeString(
          portfolioOverlay.cryptoSensitivity,
          "UNKNOWN"
        ),
      }),
    }),
    exposure: Object.freeze({
      level: exposureLevel,
      meaning:
        exposureLevel === "NONE"
          ? "No exposure posture. Remain out / avoid."
          : exposureLevel === "OBSERVE"
          ? "Observation posture only. No new exposure implied."
          : exposureLevel === "LIGHT"
          ? "Light exposure posture descriptor (risk-tightened)."
          : exposureLevel === "STANDARD"
          ? "Standard exposure posture descriptor (still shadow / gated)."
          : "Aggressive exposure posture descriptor (still shadow / gated).",
    }),
    constraints,
    checklist,
    disclaimer:
      "Execution exposure is descriptive only (SHADOW). It does not place orders, recommend trades, predict outcomes, or imply timing.",
  });
}

module.exports = Object.freeze({
  evaluateExecutionExposure,
});
