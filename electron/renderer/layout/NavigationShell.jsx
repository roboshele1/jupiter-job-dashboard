import React, { useState } from "react";
import App from "../App";

/**
 * JUPITER — Navigation Shell (AUTHORITATIVE)
 * FINAL 8-TAB ARCHITECTURE
 */

const TABS = [
  { id: "dashboard", label: "Dashboard" },
  { id: "portfolio", label: "Portfolio" },
  { id: "signals", label: "Signals" },
  { id: "discovery", label: "Discovery Lab" },
  { id: "growth", label: "Growth Engine" },
  { id: "insights", label: "Insights" },
  { id: "risk", label: "Risk Centre" },
  { id: "chat", label: "Chat" },
];

export default function NavigationShell() {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <div style={{ display: "flex", height: "100vh", background: "#0b0b0b", color: "#ffffff" }}>
      {/* LEFT NAV */}
      <aside
        style={{
          width: 240,
          borderRight: "1px solid #222",
          padding: 16,
          boxSizing: "border-box",
        }}
      >
        <h2 style={{ marginBottom: 24 }}>JUPITER</h2>

        {TABS.map((tab) => (
          <div
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: "10px 12px",
              marginBottom: 6,
              cursor: "pointer",
              borderRadius: 6,
              background: activeTab === tab.id ? "#1a1a1a" : "transparent",
              fontWeight: activeTab === tab.id ? 600 : 400,
            }}
          >
            {tab.label}
          </div>
        ))}
      </aside>

      {/* MAIN CONTENT */}
      <main style={{ flex: 1, padding: 24, overflow: "auto" }}>
        <App activeTab={activeTab} />
      </main>
    </div>
  );
}

