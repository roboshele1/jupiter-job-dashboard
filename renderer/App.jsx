// renderer/App.jsx
// JUPITER — Application Shell (V1 Read-Only, Deterministic Bootstrap)
// -----------------------------------------------------------------
// Global layout + routing. Owns persistent UI chrome only.
// No business logic. No engine access.

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
import MoonshotLab from "./pages/MoonshotLab";
import SystemState from "./pages/SystemState"; // ← ADDITIVE

import Sidebar from "./components/Sidebar";
import SystemHeartbeat from "./components/SystemHeartbeat";
import { usePortfolioSnapshotStore } from "./state/portfolioSnapshotStore";

/**
 * RAW PORTFOLIO SNAPSHOT (authoritative source)
 * Bootstrap only — read-only, deterministic
 */
const RAW_SNAPSHOT = {
  contract: "PORTFOLIO_SNAPSHOT_V1",
  currency: "USD",
  positions: [
    { symbol: "BTC", qty: 0.251083, assetClass: "crypto", live: 21848.25 },
    { symbol: "ETH", qty: 0.25, assetClass: "crypto", live: 731.84 },
    { symbol: "NVDA", qty: 73, assetClass: "equity", live: 13812.33 },
    { symbol: "ASML", qty: 10, assetClass: "equity", live: 10618.4 },
    { symbol: "AVGO", qty: 74, assetClass: "equity", live: 25849.68 },
    { symbol: "MSTR", qty: 24, assetClass: "equity", live: 3789.12 },
    { symbol: "HOOD", qty: 70, assetClass: "equity", live: 8416.8 },
    { symbol: "BMNR", qty: 115, assetClass: "equity", live: 3424.7 },
    { symbol: "APLD", qty: 150, assetClass: "equity", live: 3912.0 }
  ]
};

function normalizeSnapshot(raw) {
  const holdings = raw.positions.map(p => ({
    symbol: p.symbol,
    assetClass: p.assetClass,
    value: p.live
  }));

  const totalValue = holdings.reduce((sum, h) => sum + h.value, 0);

  return {
    contract: raw.contract,
    timestamp: Date.now(),
    holdings,
    totalValue
  };
}

export default function App() {
  const writeSnapshot = usePortfolioSnapshotStore(s => s.writeSnapshot);

  useEffect(() => {
    const normalized = normalizeSnapshot(RAW_SNAPSHOT);
    writeSnapshot(normalized);
  }, [writeSnapshot]);

  return (
    <Router>
      <div style={{ display: "flex", height: "100vh" }}>
        <Sidebar />
        <main style={{ flex: 1, overflowY: "auto" }}>
          <SystemHeartbeat />

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
            <Route path="/moonshot" element={<MoonshotLab />} />

            {/* 🟢 NEW TAB */}
            <Route path="/system" element={<SystemState />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
