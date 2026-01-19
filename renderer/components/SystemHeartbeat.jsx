// renderer/components/SystemHeartbeat.jsx
// JUPITER — System Heartbeat (Truth-Wired, Derived-Aware)
// -----------------------------------------------------
// Reports REAL autonomous runtime state.
// - Primary engines = scheduled scanners
// - Derived engines = depend on upstream snapshots
// - No simulation, no assumptions

import React, { useEffect, useState } from "react";

const ENGINE_DEFINITIONS = [
  {
    key: "discovery.ranked",
    label: "Ranked Discovery",
    type: "primary"
  },
  {
    key: "discovery.themes",
    label: "Emerging Themes",
    type: "primary"
  },
  {
    key: "watchlist.trajectory",
    label: "Watchlist Trajectory",
    type: "derived",
    dependsOn: "discovery.ranked"
  }
];

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
    last != null ? Math.floor((now - last) / 60000) : null;

  const hasRuntime = Boolean(last);
  const snapshotKeys = new Set(health.keys || []);

  function resolveEngineStatus(engine) {
    if (engine.type === "primary") {
      return snapshotKeys.has(engine.key)
        ? { state: "running", note: "active" }
        : { state: "idle", note: "awaiting first run" };
    }

    if (engine.type === "derived") {
      if (!snapshotKeys.has(engine.dependsOn)) {
        return {
          state: "blocked",
          note: "waiting for ranked discovery"
        };
      }

      return snapshotKeys.has(engine.key)
        ? { state: "derived", note: "derived from ranked discovery" }
        : { state: "pending", note: "ready after ranked run" };
    }

    return { state: "unknown", note: "" };
  }

  function dotColor(state) {
    switch (state) {
      case "running":
        return "#2ecc71";
      case "derived":
        return "#3498db";
      case "pending":
        return "#f1c40f";
      case "blocked":
        return "#999";
      default:
        return "#999";
    }
  }

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
      {/* Overall Runtime */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: hasRuntime ? "#2ecc71" : "#999"
          }}
        />
        <div>
          <div style={{ fontSize: 13, fontWeight: 500 }}>
            {hasRuntime
              ? "Runtime active · Autonomous"
              : "Runtime idle · Not yet run"}
          </div>
          <div style={{ fontSize: 11, opacity: 0.65 }}>
            {hasRuntime
              ? `Last update: ${minutesAgo} min ago`
              : "Awaiting first autonomous execution"}
          </div>
        </div>
      </div>

      {/* Engine Breakdown */}
      <div style={{ marginTop: 8, paddingLeft: 20 }}>
        {ENGINE_DEFINITIONS.map(engine => {
          const status = resolveEngineStatus(engine);
          return (
            <div
              key={engine.key}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 12,
                opacity: 0.85,
                marginTop: 4
              }}
            >
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: dotColor(status.state)
                }}
              />
              <span>{engine.label}</span>
              <span style={{ opacity: 0.6 }}>
                {status.note}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

