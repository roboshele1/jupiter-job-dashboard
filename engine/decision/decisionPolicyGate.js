// engine/decision/decisionPolicyGate.js
// Decision Engine V2 — Policy Gate
// Pure, deterministic, read-only constraint enforcement

export function applyPolicyGate({ asOf, portfolio, risk, decisions }) {
  if (!asOf || !Array.isArray(decisions)) {
    throw new Error("Invalid policy gate input");
  }

  const violations = [];
  const gated = [];

  const maxSingleAssetPct = risk?.limits?.maxSingleAssetPct ?? 0.30;
  const blockedSymbols = new Set(risk?.blockedSymbols ?? []);
  const cooldowns = risk?.cooldowns ?? {};

  for (const d of decisions) {
    let status = "ALLOW";
    const reasons = [];

    // Blocked symbols
    if (blockedSymbols.has(d.symbol)) {
      status = "BLOCK";
      reasons.push("Symbol explicitly blocked by policy");
    }

    // Concentration limit
    const weight =
      portfolio?.weights?.[d.symbol] ??
      0;

    if (weight > maxSingleAssetPct) {
      status = "MODIFY";
      reasons.push(
        `Concentration ${Math.round(weight * 100)}% exceeds limit`
      );
    }

    // Cooldown enforcement
    const cooldownUntil = cooldowns[d.symbol];
    if (cooldownUntil && asOf < cooldownUntil) {
      status = "BLOCK";
      reasons.push("Symbol in cooldown window");
    }

    gated.push({
      ...d,
      policyStatus: status,
      policyRationale: reasons,
    });

    if (status !== "ALLOW") {
      violations.push({
        symbol: d.symbol,
        action: d.action,
        status,
        reasons,
      });
    }
  }

  return {
    engine: "DECISION_ENGINE_V2_POLICY",
    asOf,
    decisions: gated,
    violations,
    summary: {
      total: decisions.length,
      allowed: gated.filter(d => d.policyStatus === "ALLOW").length,
      modified: gated.filter(d => d.policyStatus === "MODIFY").length,
      blocked: gated.filter(d => d.policyStatus === "BLOCK").length,
    },
  };
}

