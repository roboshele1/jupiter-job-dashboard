import React, { useEffect, useState } from "react";
import { getRiskSnapshot } from "../services/riskSnapshot";
import { formatRiskSnapshot } from "../utils/riskFormatter";

export default function RiskMetricsPanelSafe() {
  const [risk, setRisk] = useState(null);

  useEffect(() => {
    const raw = getRiskSnapshot();
    const formatted = formatRiskSnapshot(raw);
    setRisk(formatted);
  }, []);

  if (!risk) {
    return <div style={{ opacity: 0.6 }}>Risk data unavailable</div>;
  }

  return (
    <div
      style={{
        background: "rgba(255,255,255,0.04)",
        borderRadius: "14px",
        padding: "24px",
        maxWidth: "520px",
      }}
    >
      <h3>Risk Metrics</h3>

      <p>
        <strong>Top Holding Concentration:</strong>{" "}
        {risk.topHoldingPct.toFixed(2)}%
      </p>

      <p>
        <strong>Equities Allocation:</strong>{" "}
        {risk.allocations.Equity.toFixed(2)}%
      </p>

      <p>
        <strong>Digital Allocation:</strong>{" "}
        {risk.allocations.Digital.toFixed(2)}%
      </p>

      <p
        style={{
          marginTop: "12px",
          color: risk.thresholdBreached ? "#ff6b6b" : "#4cd964",
        }}
      >
        {risk.thresholdBreached
          ? "⚠ Concentration threshold exceeded"
          : "✓ Concentration within limits"}
      </p>

      <p style={{ opacity: 0.6, marginTop: "10px", fontSize: "12px" }}>
        Read-only · Optimization disabled in V1
      </p>
    </div>
  );
}

