import React, { useState } from "react";

import Home from "./pages/Home";
import Portfolio from "./pages/Portfolio";
import Signals from "./pages/Signals";
import Discovery from "./pages/Discovery";
import Growth from "./pages/Growth";
import Insights from "./pages/Insights";
import Risk from "./pages/Risk";
import Alerts from "./pages/Alerts";
import Chat from "./pages/Chat";
import Decisions from "./pages/Decisions";

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");

  const renderPage = () => {
    switch (activeTab) {
      case "dashboard":
        return <Home />;
      case "portfolio":
        return <Portfolio />;
      case "signals":
        return <Signals />;
      case "discovery":
        return <Discovery />;
      case "growth":
        return <Growth />;
      case "insights":
        return <Insights />;
      case "risk":
        return <Risk />;
      case "alerts":
        return <Alerts />;
      case "chat":
      case "decisions":
        return <Decisions />;

        return <Chat />;
      default:
        return <Home />;
    }
  };

  return (
    <div style={{ display: "flex", height: "100vh", background: "#0b0b0b", color: "#fff" }}>
      <aside style={{ width: 240, borderRight: "1px solid #222", padding: 16 }}>
        <h2 style={{ marginBottom: 24 }}>JUPITER</h2>

        {[
          ["dashboard", "Dashboard"],
          ["portfolio", "Portfolio"],
          ["signals", "Signals"],
          ["discovery", "Discovery Lab"],
          ["growth", "Growth Engine"],
          ["insights", "Insights"],
          ["risk", "Risk Centre"],
          ["alerts", "Alerts"],
          ["chat", "Chat"],
        ].map(([id, label]) => (
          <div
            key={id}
            onClick={() => setActiveTab(id)}
            style={{
              padding: "10px 12px",
              marginBottom: 6,
              cursor: "pointer",
              borderRadius: 6,
              background: activeTab === id ? "#1a1a1a" : "transparent",
              fontWeight: activeTab === id ? 600 : 400,
            }}
          >
            {label}
          </div>
        ))}
      </aside>

      <main style={{ flex: 1, padding: 24, overflow: "auto" }}>
        {renderPage()}
      </main>
    </div>
  );
}

