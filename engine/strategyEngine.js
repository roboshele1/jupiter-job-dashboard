import { getCurrentExposure } from "./exposureEngine";
import { getRiskScore } from "./riskEngine";
import { logDecision } from "./decisionLog";

export function runStrategyEvaluation() {
  const exposure = getCurrentExposure();
  const riskScore = getRiskScore();

  let decision = "HOLD";
  let dcaPosture = "ACTIVE";
  let confidence = "MEDIUM";
  let rationale = [];

  // ---- Strategy Rules ----
  if (riskScore >= 65) {
    decision = "REDUCE";
    dcaPosture = "PAUSE";
    confidence = "HIGH";
    rationale.push("Risk score exceeds risk cap");
  }

  if (exposure.crypto > 0.6) {
    decision = "REDUCE";
    rationale.push("Crypto exposure exceeds target band");
  }

  if (riskScore < 40 && exposure.crypto < 0.5) {
    decision = "ACCUMULATE";
    dcaPosture = "ACTIVE";
    confidence = "HIGH";
    rationale.push("Risk compressed with balanced exposure");
  }

  const snapshot = {
    decision,
    dcaPosture,
    confidence,
    riskScore,
    exposure,
    rationale
  };

  // 🔐 AUTOMATIC DECISION CAPTURE (Phase 5 Step 4)
  logDecision(snapshot);

  return snapshot;
}

