// renderer/App.jsx
// JUPITER — Application Shell (Session 7 — clean)
//
// Changes from previous version:
//   - Removed RAW_SNAPSHOT hardcoded static data (was poisoning portfolioSnapshotStore)
//   - Removed usePortfolioSnapshotStore (no file in renderer/state matches this import
//     at runtime; store is unused by the real tabs which all use IPC directly)
//   - All tabs source data exclusively from window.jupiter.invoke() IPC — authoritative

import React from "react";
import { HashRouter as Router, Routes, Route } from "react-router-dom";

import Dashboard     from "./pages/Dashboard";
import Portfolio     from "./pages/Portfolio";
import Signals       from "./pages/Signals";
import DiscoveryLab  from "./pages/DiscoveryLab";
import GrowthEngine  from "./pages/GrowthEngine";
import Insights      from "./pages/Insights";
import RiskCentre    from "./pages/RiskCentre";
import MarketMonitor from "./pages/MarketMonitor";
import MoonshotLab   from "./pages/MoonshotLab";
import GoalEngine    from "./pages/GoalEngine";
import Decisions     from "./pages/Decisions";

import Sidebar         from "./components/Sidebar";
import SystemHeartbeat from "./components/SystemHeartbeat";

export default function App() {
  return (
    <Router>
      <div style={{ display: "flex", height: "100vh" }}>
        <Sidebar />
        <main style={{ flex: 1, overflowY: "auto" }}>
          <SystemHeartbeat />
          <Routes>
            <Route path="/"          element={<Dashboard />}     />
            <Route path="/dashboard" element={<Dashboard />}     />
            <Route path="/portfolio" element={<Portfolio />}     />
            <Route path="/signals"   element={<Signals />}       />
            <Route path="/discovery" element={<DiscoveryLab />}  />
            <Route path="/growth"    element={<GrowthEngine />}  />
            <Route path="/insights"  element={<Insights />}      />
            <Route path="/risk"      element={<RiskCentre />}    />
            <Route path="/market"    element={<MarketMonitor />} />
            <Route path="/moonshot"  element={<MoonshotLab />}   />
            <Route path="/goal"      element={<GoalEngine />}    />
            <Route path="/decisions" element={<Decisions />}     />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
