// renderer/App.jsx
// JUPITER — Application Shell (V1 Read-Only)

import React from "react";
import { HashRouter as Router, Routes, Route } from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import Portfolio from "./pages/Portfolio";
import Signals from "./pages/Signals";
import DiscoveryLab from "./pages/DiscoveryLab";
import GrowthEngine from "./pages/GrowthEngine";
import Insights from "./pages/Insights";
import RiskCentre from "./pages/RiskCentre";
import MarketMonitor from "./pages/MarketMonitor";
import Chat from "./pages/Chat";

import Sidebar from "./components/Sidebar";

export default function App() {
  return (
    <Router>
      <div style={{ display: "flex", height: "100vh" }}>
        <Sidebar />

        <main style={{ flex: 1, overflowY: "auto" }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/portfolio" element={<Portfolio />} />
            <Route path="/signals" element={<Signals />} />
            <Route path="/discovery" element={<DiscoveryLab />} />
            <Route path="/growth" element={<GrowthEngine />} />
            <Route path="/insights" element={<Insights />} />
            <Route path="/risk" element={<RiskCentre />} />
            <Route path="/market" element={<MarketMonitor />} />
            <Route path="/chat" element={<Chat />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

