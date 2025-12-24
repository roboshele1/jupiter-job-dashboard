// renderer/App.jsx
// JUPITER — Application Shell (V1 Read-Only, Deterministic Bootstrap)

import React, { useEffect } from "react";
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

// ✅ AUTHORITATIVE SNAPSHOT — SAME DATA AS YOUR TERMINAL/UI
import { usePortfolioSnapshotStore } from "./state/portfolioSnapshotStore";

const SNAPSHOT = {
  contract: "PORTFOLIO_SNAPSHOT_V1",
  currency: "USD",
  totals: {
    snapshotValue: 23300.27,
    liveValue: 22606.40,
    delta: -693.87,
    deltaPct: -2.98
  },
  positions: [
    { symbol: "BTC", qty: 0.251083, assetClass: "crypto", snapshot: 22597.47, live: 21848.25 },
    { symbol: "ETH", qty: 0.25, assetClass: "crypto", snapshot: 702.8, live: 731.84 },
    { symbol: "NVDA", qty: 73, assetClass: "equity", snapshot: 0, live: 13812.33 },
    { symbol: "ASML", qty: 10, assetClass: "equity", snapshot: 0, live: 10618.4 },
    { symbol: "AVGO", qty: 74, assetClass: "equity", snapshot: 0, live: 25849.68 },
    { symbol: "MSTR", qty: 24, assetClass: "equity", snapshot: 0, live: 3789.12 },
    { symbol: "HOOD", qty: 70, assetClass: "equity", snapshot: 0, live: 8416.8 },
    { symbol: "BMNR", qty: 115, assetClass: "equity", snapshot: 0, live: 3424.7 },
    { symbol: "APLD", qty: 150, assetClass: "equity", snapshot: 0, live: 3912.0 }
  ]
};

export default function App() {
  const writeSnapshot = usePortfolioSnapshotStore(s => s.writeSnapshot);

  useEffect(() => {
    console.log("[BOOTSTRAP] Writing portfolio snapshot to store");
    writeSnapshot(SNAPSHOT);
  }, [writeSnapshot]);

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

