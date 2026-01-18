// renderer/components/SystemHeartbeat.jsx
// JUPITER — Global System Heartbeat (Read-Only, V1)
// -------------------------------------------------
// Purpose: Provide institutional-grade assurance that
// Jupiter is actively running background scanners.
// No data dependencies. No side effects.

import React, { useEffect, useState } from "react";

const STATES = [
  "Scanning emerging themes",
  "Ranking discovery candidates",
  "Monitoring signals & momentum",
  "Watching volatility regimes",
  "Idle · No actionable signals"
];

export default function SystemHeartbeat() {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIdx((i) => (i + 1) % STATES.length);
    }, 20000); // slow, calm rotation
    return () => clearInterval(id);
  }, []);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 14px",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        background: "rgba(0,0,0,0.25)",
        position: "sticky",
        top: 0,
        zIndex: 10
      }}
    >
      {/* Pulse indicator */}
      <div
        style={{
          width: 10,
          height: 10,
          borderRadius: "50%",
          background: "#2ecc71",
          boxShadow: "0 0 6px rgba(46, 204, 113, 0.8)",
          animation: "pulse 2.5s ease-in-out infinite"
        }}
      />

      {/* Copy */}
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ fontSize: 13, fontWeight: 500 }}>
          Scanner running · Monitoring markets
        </div>
        <div style={{ fontSize: 11, opacity: 0.65 }}>
          {STATES[idx]}
        </div>
      </div>

      <style>
        {`
          @keyframes pulse {
            0%   { transform: scale(0.9); opacity: 0.6; }
            50%  { transform: scale(1.2); opacity: 1; }
            100% { transform: scale(0.9); opacity: 0.6; }
          }
        `}
      </style>
    </div>
  );
}

