// renderer/pages/Chat.jsx
// Phase 2 — Read-only Chat with semantic interpretation
// ZERO inference, ZERO actions, ZERO mutation

import React, { useEffect, useState } from "react";
import { readDashboardTruth } from "../stores/dashboardRead";

export default function Chat() {
  const [truth, setTruth] = useState(null);

  useEffect(() => {
    const snapshot = readDashboardTruth();
    setTruth(snapshot);
  }, []);

  if (!truth) {
    return (
      <div className="page">
        <h1>Chat</h1>
        <p>Initializing dashboard context…</p>
      </div>
    );
  }

  const {
    portfolioValue,
    dailyPL,
    dailyPLPct,
    allocation,
    topHoldings,
    snapshotTimestamp
  } = truth;

  return (
    <div className="page">
      <h1>Chat</h1>
      <p className="muted">
        Read-only Dashboard context (Phase 2).
      </p>

      <div className="card">
        <h2>Dashboard Interpretation</h2>

        <ul className="interpretation">
          <li>
            <strong>Snapshot time:</strong>{" "}
            {snapshotTimestamp || "Not available"}
          </li>

          <li>
            <strong>Total portfolio value:</strong>{" "}
            {portfolioValue != null
              ? `$${portfolioValue.toLocaleString()}`
              : "Not yet computed"}
          </li>

          <li>
            <strong>Daily P/L:</strong>{" "}
            {dailyPL != null ? dailyPL : "Unavailable"}
          </li>

          <li>
            <strong>Daily P/L %:</strong>{" "}
            {dailyPLPct != null ? `${dailyPLPct}%` : "Unavailable"}
          </li>

          <li>
            <strong>Allocation summary:</strong>{" "}
            {allocation
              ? Object.entries(allocation)
                  .map(([k, v]) => `${k}: ${v}%`)
                  .join(" | ")
              : "Not hydrated"}
          </li>

          <li>
            <strong>Top holdings:</strong>{" "}
            {topHoldings && topHoldings.length > 0
              ? topHoldings
                  .map(h => `${h.symbol} (${h.quantity})`)
                  .join(", ")
              : "Not hydrated"}
          </li>
        </ul>

        <p className="muted">
          Chat is operating in observer mode. No inference or actions
          are permitted in Phase 2.
        </p>
      </div>
    </div>
  );
}

