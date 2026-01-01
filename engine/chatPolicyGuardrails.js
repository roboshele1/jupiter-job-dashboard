/**
 * Chat Policy Guardrails — Phase 5
 * --------------------------------
 * Purpose:
 * - Enforce hard behavioral limits for Chat consumption
 * - Prevent advice, actions, predictions, or commands
 * - Operate strictly in observer / explanatory mode
 *
 * Scope:
 * - Chat tab only
 * - Read-only enforcement
 *
 * Constraints:
 * - NO UI
 * - NO IPC
 * - NO engine mutation
 * - Deterministic logic only
 */

export const CHAT_POLICY = Object.freeze({
  mode: "observer",
  phase: 5,

  allowedCapabilities: {
    explain: true,
    summarize: true,
    describe: true,
    contextualize: true,
  },

  forbiddenCapabilities: {
    recommend: true,
    predict: true,
    optimize: true,
    instruct: true,
    trade: true,
    allocate: true,
    rebalance: true,
  },

  disclaimers: {
    enforced: true,
    message:
      "Observer mode active. Explanatory only. No recommendations, actions, or predictions.",
  },
});

/**
 * Enforce chat policy guardrails
 * Returns a sanitized response contract
 */
export function applyChatPolicy(input) {
  return {
    system: {
      phase: CHAT_POLICY.phase,
      mode: CHAT_POLICY.mode,
      policyEnforced: true,
    },

    inputReceived: Boolean(input),

    constraints: {
      allowed: CHAT_POLICY.allowedCapabilities,
      forbidden: CHAT_POLICY.forbiddenCapabilities,
    },

    disclaimer: CHAT_POLICY.disclaimers.message,

    outputRules: {
      noAdvice: true,
      noActions: true,
      noPredictions: true,
      noCommands: true,
    },
  };
}

