// renderer/components/SystemHeartbeat.jsx
// JUPITER — Global System Heartbeat (Truth-Wired, V2)
// --------------------------------------------------
// Reports real autonomous runtime health via IPC.
// No simulation. No assumptions.

import React, { useEffect, useState } from "react";

export default function SystemHeartbeat() {
  const [health, setHealth] = useState({ lastUpdated: null, keys: [] });

  async function fetchHealth() {
    try {
      const h = await window.jupiter.invoke("runtime:getHealth");
      setHealth(h || { lastUpdated: null, keys: [] });
    } catch {
      setHealth({ lastUpdated: null, keys: [] });
    }
  }

  useEffect(() => {
    fetchHealth();
    const id = setInterval(fetchHealth, 10_000);
    return () => clearInterval(id);
  }, []);

  const now = Date.now();
  const last = health.lastUpdated;
  const minutesAgo =
    last ? Math.floor((now - last) / 60000) : null;

  const isRunning = Boolean(last);

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
      <div
        style={{
          width: 10,
          height: 10,
          borderRadius: "50%",
          background: isRunning ? "#2ecc71" : "#999",
          boxShadow: isRunning
            ? "0 0 6px rgba(46, 204, 113, 0.8)"
            : "none"
        }}
      />

      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ fontSize: 13, fontWeight: 500 }}>
          {isRunning
            ? "Scanner running · Autonomous"
            : "Scanner idle · Not yet run"}
        </div>
        <div style={{ fontSize: 11, opacity: 0.65 }}>
          {isRunning
            ? `Last discovery scan: ${minutesAgo} min ago`
            : "Awaiting first autonomous execution"}
        </div>
      </div>
    </div>
  );
}

