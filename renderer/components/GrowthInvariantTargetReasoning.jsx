import { useMemo } from "react";

/**
 * Growth Invariant 1 — Target Value Reasoning
 * ------------------------------------------
 * Pure renderer module.
 * No IPC. No mutation. No assumptions.
 *
 * PURPOSE:
 * Given:
 * - candidate allocation ($)
 * - assumed CAGR
 * - time horizon (months)
 *
 * Compute:
 * - implied terminal value
 * - capital multiple
 *
 * This answers: "What does this position become if I am right?"
 */

export default function GrowthInvariantTargetReasoning({
  amount,
  assumedCAGR,
  months
}) {
  const result = useMemo(() => {
    if (!amount || !assumedCAGR || !months) return null;

    const years = months / 12;
    const terminalValue = amount * Math.pow(1 + assumedCAGR, years);
    const multiple = terminalValue / amount;

    return {
      terminalValue,
      multiple
    };
  }, [amount, assumedCAGR, months]);

  if (!result) return null;

  return (
    <div
      style={{
        marginTop: 16,
        padding: 14,
        borderRadius: 10,
        background: "rgba(34,197,94,0.12)",
        border: "1px solid rgba(34,197,94,0.35)"
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: 6 }}>
        Target Outcome (Invariant)
      </div>

      <div style={{ fontSize: 13, opacity: 0.9 }}>
        If <strong>${amount.toLocaleString()}</strong> compounds at{" "}
        <strong>{(assumedCAGR * 100).toFixed(2)}%</strong> for{" "}
        <strong>{months}</strong> months:
      </div>

      <div style={{ marginTop: 8 }}>
        <strong>Terminal Value:</strong>{" "}
        ${result.terminalValue.toLocaleString(undefined, {
          maximumFractionDigits: 0
        })}
      </div>

      <div>
        <strong>Capital Multiple:</strong>{" "}
        {result.multiple.toFixed(2)}×
      </div>
    </div>
  );
}
