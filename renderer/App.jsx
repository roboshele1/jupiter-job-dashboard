import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Sidebar from "./components/Sidebar";

import Dashboard from "./pages/Dashboard";
import Portfolio from "./pages/Portfolio";
import Signals from "./pages/Signals";
import DiscoveryLab from "./pages/DiscoveryLab";
import GrowthEngine from "./pages/GrowthEngine";
import Insights from "./pages/Insights";
import Risk from "./pages/Risk";
import Chat from "./pages/Chat";
import MarketMonitor from "./pages/MarketMonitor";

export default function App() {
  return (
    <BrowserRouter>
      <div style={{ display: "flex", height: "100vh" }}>
        <Sidebar />
        <main style={{ flex: 1, padding: "32px" }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/portfolio" element={<Portfolio />} />
            <Route path="/signals" element={<Signals />} />
            <Route path="/discovery" element={<DiscoveryLab />} />
            <Route path="/growth" element={<GrowthEngine />} />
            <Route path="/insights" element={<Insights />} />
            <Route path="/risk" element={<Risk />} />
            <Route path="/market-monitor" element={<MarketMonitor />} />
            <Route path="/chat" element={<Chat />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

