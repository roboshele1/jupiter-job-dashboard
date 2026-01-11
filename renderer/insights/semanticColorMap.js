// renderer/insights/semanticColorMap.js

export function semanticColor(value) {
  if (!value) return "#9ca3af"; // neutral gray

  const v = String(value).toUpperCase();

  if (["CRITICAL", "EXTREME", "FAIL", "BREACH", "RED"].includes(v))
    return "#ef4444"; // red

  if (["HIGH", "DETERIORATING", "RISK_OFF"].includes(v))
    return "#f97316"; // orange

  if (["MODERATE", "CAUTION", "WARNING", "YELLOW"].includes(v))
    return "#eab308"; // yellow

  if (["LOW", "ALIGNED", "STABLE"].includes(v))
    return "#22c55e"; // green

  if (["READY", "IMPROVING", "RISK_ON"].includes(v))
    return "#16a34a"; // strong green

  if (["UNKNOWN", "NEUTRAL", "TRANSITION"].includes(v))
    return "#9ca3af"; // gray

  return "#9ca3af";
}
