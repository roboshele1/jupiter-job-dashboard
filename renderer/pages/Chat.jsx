// renderer/pages/Chat.jsx

import React from "react";
import { readDashboardTruth } from "../stores/dashboardRead";

export default function Chat() {
  const truth = readDashboardTruth();

  const {
    portfolioValue,
    dailyPL,
    dailyPLPct,
    allocation,
    topHoldings,
    snapshotTimestamp,
  } = truth;

  return (
    <div style={{ padding: 24 }}>
      <h1>Chat</h1>
      <p style={{ opacity: 0.7 }}>
        Read-only Dashboard context (Phase 2).
      </p>

      <div
        style={{
          marginTop: 24,
          padding: 16,
          borderRadius: 12,
          background: "rgba(255,255,255,0.04)",
          fontFamily: "monospace",
          fontSize: 14,
        }}
      >
        <h3 style={{ marginBottom: 12 }}>Dashboard Interpretation</h3>

        <ul>
          <li>
            <strong>Snapshot time:</strong>{" "}
            {snapshotTimestamp ?? "Not available"}
          </li>

          <li>
            <strong>Total portfolio value:</strong>{" "}
            {portfolioValue !== null
              ? `$${portfolioValue.toLocaleString()}`
              : "Not yet computed"}
          </li>

          <li>
            <strong>Daily P/L:</strong>{" "}
            {dailyPL !== null
              ? `${dailyPL >= 0 ? "+" : "-"}$${Math.abs(dailyPL).toFixed(2)}`
              : "Unavailable"}
          </li>

          <li>
            <strong>Daily P/L %:</strong>{" "}
            {dailyPLPct !== null
              ? `${dailyPLPct.toFixed(2)}%`
              : "Unavailable"}
          </li>

          <li>
            <strong>Allocation summary:</strong>{" "}
            {allocation ? "Present" : "Not hydrated"}
          </li>

          <li>
            <strong>Top holdings:</strong>{" "}
            {topHoldings ? "Present" : "Not hydrated"}
          </li>
        </ul>

        <p style={{ marginTop: 12, opacity: 0.6 }}>
          Chat is operating in observer mode. No inference or actions are
          permitted in Phase 2.
        </p>
      </div>
    </div>
  );
}

