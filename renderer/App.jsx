// renderer/App.jsx

import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Core pages
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Portfolio from "./pages/Portfolio";
import RiskCentre from "./pages/RiskCentre";
import Insights from "./pages/Insights";
import Chat from "./pages/Chat";
import DiscoveryLab from "./pages/DiscoveryLab";
import GrowthEngine from "./pages/GrowthEngine";
import MarketMonitor from "./pages/MarketMonitor";
import Signals from "./pages/Signals";
import Risk from "./pages/Risk";
import News from "./pages/News";
import System from "./pages/System";

// Layout
import Sidebar from "./components/Sidebar";

export default function App() {
  return (
    <BrowserRouter>
      <div
        style={{
          height: "100vh",
          width: "100vw",
          display: "flex",
          background: "linear-gradient(135deg, #050b1e, #020617)",
          color: "#e5e7eb",
          fontFamily: "system-ui, -apple-system, BlinkMacSystemFont",
        }}
      >
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content */}
        <div style={{ flex: 1, padding: "40px", overflow: "auto" }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/portfolio" element={<Portfolio />} />
            <Route path="/risk" element={<RiskCentre />} />
            <Route path="/risk-centre" element={<RiskCentre />} />
            <Route path="/insights" element={<Insights />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/discovery" element={<DiscoveryLab />} />
            <Route path="/growth" element={<GrowthEngine />} />
            <Route path="/market" element={<MarketMonitor />} />
            <Route path="/signals" element={<Signals />} />
            <Route path="/news" element={<News />} />
            <Route path="/system" element={<System />} />

            {/* Safety fallback */}
            <Route path="*" element={<Dashboard />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

