// renderer/App.jsx
// JUPITER — Application Shell with Firebase Auth Gate
// Auth state: undefined=loading, null=logged out, object=logged in

import React, { useEffect } from "react";
import { HashRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "./AuthContext";
import { AlertProvider } from "./context/AlertContext";
import AlertBanner from "./components/AlertBanner";

import Dashboard     from "./pages/Dashboard";
import Signals       from "./pages/Signals";
import DiscoveryLab  from "./pages/DiscoveryLab";
import GrowthEngine  from "./pages/GrowthEngine";
import RiskCentre    from "./pages/RiskCentre";
import MarketMonitor from "./pages/MarketMonitor";
import MoonshotLab   from "./pages/MoonshotLab";
import GoalEngine    from "./pages/GoalEngine";
import Performance   from "./pages/Performance";
import Rebalancing  from "./pages/Rebalancing";
import LearningLoop   from "./pages/LearningLoop";
import JupiterAI     from "./pages/JupiterAI";
import DCAaudit       from "./pages/DCAaudit";
import MonteCarlo    from "./pages/MonteCarlo";
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

  useEffect(() => {
    const pollSignals = async () => {
      try {
        const result = await window.jupiter.invoke("signals:getActiveSignal");
        if (result.active) {
          window.jupiter.signalBadge = result.badge;
          window.dispatchEvent(new CustomEvent("jupiter:signal-badge-update", { detail: result }));
          
          if ("Notification" in window && Notification.permission === "granted") {
            new Notification(`${result.symbol} Entry Zone Active`, {
              body: `${result.entryZone} | Confidence: ${result.confidence}`,
              tag: "signal-" + result.symbol,
            });
          }
        } else {
          window.jupiter.signalBadge = null;
        }
      } catch (err) {
        console.error("[App] Signal poll failed:", err.message);
      }
    };

    pollSignals();
    const interval = setInterval(pollSignals, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

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
    <AlertProvider>
      <AlertBanner />
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
            <Route path="/market"     element={<MarketMonitor />} />
            <Route path="/moonshot"   element={<MoonshotLab />}   />
            <Route path="/goal"       element={<GoalEngine />}    />
            <Route path="/monte-carlo" element={<MonteCarlo />} />
            <Route path="/audit" element={<DCAaudit />} />


            <Route path="/rebalancing" element={<Rebalancing />}   />
            <Route path="/learningloop" element={<LearningLoop />}  />
            <Route path="/performance" element={<Performance />}    />
            <Route path="/jupiterai"  element={<JupiterAI />}     />
            <Route path="/portfolios" element={<Portfolios />}    />
            <Route path="/risk"       element={<RiskCentre />}    />
          </Routes>
        </main>
      </div>
    </Router>
    </AlertProvider>
  );
}

window.signalBadgeData = null;

function AuthGate() {
  const { user } = useAuth();

  if (user === undefined) return <LoadingScreen />;
  if (user === null)      return <Login />;
  return <AppShell />;
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function App() {
  React.useEffect(() => {
    if ("Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission().then(permission => {
          console.log("[App] Notification permission:", permission);
        });
      } else {
        console.log("[App] Notification permission:", Notification.permission);
      }
    }
  }, []);

  React.useEffect(() => {
    if (!window.electron?.ipcRenderer) return;

    const handleAlert = (event, alert) => {
      if (Notification.permission !== "granted") return;

      let title = "";
      let options = {
        tag: alert.id,
        silent: false,
      };

      if (alert.type === "SIGNAL_ACTIVE") {
        title = `${alert.symbol} Entry Zone Active`;
        options.body = `${alert.entryZone} | Confidence: ${alert.confidence}`;
      } else if (alert.type === "CONVICTION_SHIFT") {
        title = `${alert.symbol} Conviction Shifted`;
        options.body = `${alert.oldConviction.toFixed(2)} → ${alert.newConviction.toFixed(2)}`;
      } else if (alert.type === "POSITION_DRIFT") {
        title = `${alert.symbol} Position Drift`;
        options.body = `${alert.deltaPct.toFixed(1)}% below cost basis`;
      }

      if (title) {
        new Notification(title, options);
        console.log("[App] Notification fired:", title);
      }
    };

    window.electron.ipcRenderer.on("jupiter:alert", handleAlert);

    return () => {
      window.electron.ipcRenderer.removeListener("jupiter:alert", handleAlert);
    };
  }, []);

  return (
    <AuthProvider>
      <AuthGate />
    </AuthProvider>
  );
}
