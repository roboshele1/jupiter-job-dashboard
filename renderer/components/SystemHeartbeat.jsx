// renderer/components/SystemHeartbeat.jsx
// JUPITER — Global System Heartbeat (Truth-Wired, Path B)
// -----------------------------------------------------
// Reports real autonomous runtime health per engine.
// Read-only. IPC-backed. No simulation.

import React, { useEffect, useState } from "react";

/**
 * Engine labels (UI-only mapping, no logic)
 */
const ENGINE_LABELS = {
  "discovery.ranked": "Ranked Discovery",
  "discovery.themes": "Emerging Themes"
};

export default function SystemHeartbeat() {
  const [health, setHealth] = useState({
    lastUpdated: null,
    keys: []
  });

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
    last != null ? Math.floor((now - last) / 60000) : null;

  const isRuntimeActive = Boolean(last);

  return (
    <div
      style={{
        padding: "10px 14px",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        background: "rgba(0,0,0,0.25)",
        position: "sticky",
        top: 0,
        zIndex: 10
      }}
    >
      {/* ─────────────────────────────
         GLOBAL RUNTIME STATUS
         ───────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: isRuntimeActive ? "#2ecc71" : "#999",
            boxShadow: isRuntimeActive
              ? "0 0 6px rgba(46, 204, 113, 0.8)"
              : "none"
          }}
        />
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 13, fontWeight: 500 }}>
            {isRuntimeActive
              ? "Autonomous runtime active"
              : "Runtime idle · Not yet run"}
          </div>
          <div style={{ fontSize: 11, opacity: 0.65 }}>
            {isRuntimeActive
              ? `Last autonomous activity: ${minutesAgo} min ago`
              : "Awaiting first autonomous execution"}
          </div>
        </div>
      </div>

      {/* ─────────────────────────────
         PER-ENGINE STATUS
         ───────────────────────────── */}
      <div style={{ marginTop: 8, paddingLeft: 20 }}>
        {Object.entries(ENGINE_LABELS).map(([key, label]) => {
          const hasRun = health.keys.includes(key);

          return (
            <div
              key={key}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginTop: 4
              }}
            >
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: hasRun ? "#2ecc71" : "#999",
                  opacity: hasRun ? 1 : 0.6
                }}
              />
              <div style={{ fontSize: 12, opacity: 0.85 }}>
                {label}
              </div>
              <div style={{ fontSize: 11, opacity: 0.55 }}>
                {hasRun ? "active" : "awaiting first run"}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

