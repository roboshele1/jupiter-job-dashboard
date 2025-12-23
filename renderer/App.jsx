import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Sidebar from "./components/Sidebar";

// Core pages
import Dashboard from "./pages/Dashboard.jsx";
import Portfolio from "./pages/Portfolio.jsx";
import Signals from "./pages/Signals.jsx";
import DiscoveryLab from "./pages/DiscoveryLab.jsx";
import GrowthEngine from "./pages/GrowthEngine.jsx";
import Insights from "./pages/Insights.jsx";
import RiskCentre from "./pages/RiskCentre.jsx";
import MarketMonitor from "./pages/MarketMonitor.jsx";
import Chat from "./pages/Chat.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <div style={{ display: "flex", height: "100vh" }}>
        <Sidebar />

        <div style={{ flex: 1 }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/portfolio" element={<Portfolio />} />
            <Route path="/signals" element={<Signals />} />
            <Route path="/discovery" element={<DiscoveryLab />} />
            <Route path="/growth" element={<GrowthEngine />} />
            <Route path="/insights" element={<Insights />} />
            <Route path="/risk" element={<RiskCentre />} />
            <Route path="/market-monitor" element={<MarketMonitor />} />
            <Route path="/chat" element={<Chat />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

