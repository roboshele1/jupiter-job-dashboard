// renderer/App.jsx
// JUPITER — Application Shell with Firebase Auth Gate
// Auth state: undefined=loading, null=logged out, object=logged in

import React, { useEffect } from "react";
import { HashRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "./AuthContext";

import Dashboard     from "./pages/Dashboard";
import Signals       from "./pages/Signals";
import DiscoveryLab  from "./pages/DiscoveryLab";
import GrowthEngine  from "./pages/GrowthEngine";
import Insights      from "./pages/Insights";
import RiskCentre    from "./pages/RiskCentre";
import MarketMonitor from "./pages/MarketMonitor";
import MoonshotLab   from "./pages/MoonshotLab";
import GoalEngine    from "./pages/GoalEngine";
import Decisions     from "./pages/Decisions";
import JupiterAI     from "./pages/JupiterAI";
import Portfolios    from "./pages/Portfolios";
import Login         from "./pages/Login";

import Sidebar from "./components/Sidebar";
import { initialSyncToCloud } from "./jupiterSync";

const C = { bg: "#060910", mono: "'IBM Plex Mono', monospace" };

// ─── Loading Screen ───────────────────────────────────────────────────────────
function LoadingScreen() {
  return (
    <div style={{
      background: C.bg, minHeight: "100vh",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: C.mono,
    }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 28, fontWeight: 900, color: "#e2e8f0", marginBottom: 16 }}>
          ◈ JUPITER
        </div>
        <div style={{ fontSize: 11, color: "#6b7280", letterSpacing: "0.1em" }}>
          INITIALIZING…
        </div>
      </div>
    </div>
  );
}

// ─── Authenticated shell ──────────────────────────────────────────────────────
function AppShell() {
  const { user, setSyncing } = useAuth();

  // On first login — push local data to Firestore
  useEffect(() => {
    if (!user) return;
    (async () => {
      setSyncing(true);
      try {
        // Gather local data via IPC
        const [holdings, memorySummary, lcpeSummary] = await Promise.allSettled([
          window.jupiter.invoke("holdings:getRaw"),
          window.jupiter.invoke("memory:getRecentEvents", 500),
          window.jupiter.invoke("lcpe:getFeedbackSummary"),
        ]);

        await initialSyncToCloud(user.uid, {
          holdings:       holdings.status       === "fulfilled" ? holdings.value       : [],
          memoryEvents:   memorySummary.status   === "fulfilled" ? memorySummary.value  : [],
          lcpeExecutions: lcpeSummary.status     === "fulfilled" ? [lcpeSummary.value]  : [],
          settings: {
            goalTarget: 1000000,
            goalYear:   2037,
            currency:   "CAD",
            email:      user.email,
            displayName: user.displayName || user.email,
          },
        });
      } catch (e) {
        console.warn("[SYNC] Initial sync failed:", e.message);
      } finally {
        setSyncing(false);
      }
    })();
  }, [user?.uid]);

  return (
    <Router>
      <div style={{ display: "flex", height: "100vh" }}>
        <Sidebar />
        <main style={{ flex: 1, overflowY: "auto" }}>
          <Routes>
            <Route path="/"           element={<Dashboard />}     />
            <Route path="/dashboard"  element={<Dashboard />}     />
            <Route path="/signals"    element={<Signals />}       />
            <Route path="/discovery"  element={<DiscoveryLab />}  />
            <Route path="/growth"     element={<GrowthEngine />}  />
            <Route path="/insights"   element={<Insights />}      />
            <Route path="/risk"       element={<RiskCentre />}    />
            <Route path="/market"     element={<MarketMonitor />} />
            <Route path="/moonshot"   element={<MoonshotLab />}   />
            <Route path="/goal"       element={<GoalEngine />}    />
            <Route path="/decisions"  element={<Decisions />}     />
            <Route path="/jupiterai"  element={<JupiterAI />}     />
            <Route path="/portfolios" element={<Portfolios />}    />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

// ─── Auth gate ────────────────────────────────────────────────────────────────
function AuthGate() {
  const { user } = useAuth();

  if (user === undefined) return <LoadingScreen />;
  if (user === null)      return <Login />;
  return <AppShell />;
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <AuthProvider>
      <AuthGate />
    </AuthProvider>
  );
}
