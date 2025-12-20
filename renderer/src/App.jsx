import React, { useState } from "react";

import Home from "./pages/Home";
import Portfolio from "./pages/Portfolio";
import Analytics from "./pages/Analytics";
import Risk from "./pages/Risk";
import Signals from "./pages/Signals";
import Alerts from "./pages/Alerts";
import Discovery from "./pages/Discovery";
import News from "./pages/News";
import Insights from "./pages/Insights";
import Chat from "./pages/Chat";

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");

  const renderPage = () => {
    switch (activeTab) {
      case "dashboard": return <Home />;
      case "portfolio": return <Portfolio />;
      case "analytics": return <Analytics />;
      case "risk": return <Risk />;
      case "signals": return <Signals />;
      case "alerts": return <Alerts />;
      case "discovery": return <Discovery />;
      case "news": return <News />;
      case "insights": return <Insights />;
      case "chat": return <Chat />;
      default: return <Home />;
    }
  };

  const tabs = [
    ["dashboard", "Dashboard"],
    ["portfolio", "Portfolio"],
    ["analytics", "Analytics"],
    ["risk", "Risk"],
    ["signals", "Signals"],
    ["alerts", "Alerts"],
    ["discovery", "Discovery"],
    ["news", "News"],
    ["insights", "Insights"],
    ["chat", "Chat"],
  ];

  return (
    <div style={{ display: "flex", height: "100vh", background: "#0b0b0b", color: "#fff" }}>
      <aside style={{ width: 240, padding: 16, borderRight: "1px solid #222" }}>
        <h2 style={{ marginBottom: 24 }}>JUPITER</h2>
        {tabs.map(([id, label]) => (
          <div
            key={id}
            onClick={() => setActiveTab(id)}
            style={{
              padding: "10px 12px",
              marginBottom: 6,
              cursor: "pointer",
              borderRadius: 6,
              background: activeTab === id ? "#1a1a1a" : "transparent",
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

