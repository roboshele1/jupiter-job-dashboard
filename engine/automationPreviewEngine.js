/**
 * JUPITER — Automation Preview Engine
 * Phase 7 Step 3
 *
 * NON-EXECUTABLE BY DESIGN
 */

function classifyIntent(severity) {
  if (severity === "HIGH") return "CRITICAL";
  if (severity === "MEDIUM") return "ATTENTION";
  return "SAFE";
}

export function runAutomationPreview(systemState) {
  const intents = [];

  if (!systemState) return intents;

  const { risk, exposure, strategy } = systemState;

  // ---- Rule: Pause DCA on high risk ----
  if (risk.score >= 65 && strategy.dcaPosture !== "PAUSE") {
    intents.push({
      type: "WOULD_PAUSE_DCA",
      reason: "Risk score exceeds automation threshold",
      severity: "HIGH",
      category: classifyIntent("HIGH"),
      executable: false,
    });
  }

  // ---- Rule: Resume DCA on low risk ----
  if (risk.score < 55 && strategy.dcaPosture === "PAUSE") {
    intents.push({
      type: "WOULD_RESUME_DCA",
      reason: "Risk score normalized below threshold",
      severity: "MEDIUM",
      category: classifyIntent("MEDIUM"),
      executable: false,
    });
  }

  // ---- Rule: Rebalance exposure ----
  if (exposure.crypto > 60) {
    intents.push({
      type: "WOULD_REBALANCE",
      reason: "Crypto exposure exceeds target band",
      severity: "HIGH",
      category: classifyIntent("HIGH"),
      executable: false,
    });
  }

  // ---- Default ----
  if (intents.length === 0) {
    intents.push({
      type: "NO_AUTOMATION_ACTION",
      reason: "All conditions within tolerance",
      severity: "LOW",
      category: classifyIntent("LOW"),
      executable: false,
    });
  }

  return intents;
}

