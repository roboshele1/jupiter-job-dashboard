import { useEffect, useState } from "react";

import Dashboard from "./pages/Dashboard";
import Portfolio from "./pages/Portfolio";
import Signals from "./pages/Signals";
import DiscoveryLab from "./pages/DiscoveryLab";
import GrowthEngine from "./pages/GrowthEngine";
import Insights from "./pages/Insights";
import MarketMonitor from "./pages/MarketMonitor";
import Chat from "./pages/Chat";

export default function App() {
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [marketSnapshot, setMarketSnapshot] = useState(null);
  const [snapshotStatus, setSnapshotStatus] = useState("INIT");

  // Single authoritative snapshot fetch (shared by MarketMonitor + Chat)
  useEffect(() => {
    let mounted = true;

    const fetchSnapshot = async () => {
      try {
        setSnapshotStatus("LOADING");
        const res = await fetch("http://localhost:3001/snapshot");
        if (!res.ok) throw new Error("Snapshot fetch failed");
        const data = await res.json();
        if (mounted) {
          setMarketSnapshot(data);
          setSnapshotStatus("LIVE");
        }
      } catch (err) {
        if (mounted) {
          setMarketSnapshot(null);
          setSnapshotStatus("ERROR");
        }
      }
    };

    fetchSnapshot();
    const interval = setInterval(fetchSnapshot, 15_000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const renderTab = () => {
    switch (activeTab) {
      case "Dashboard":
        return <Dashboard marketSnapshot={marketSnapshot} />;
      case "Portfolio":
        return <Portfolio marketSnapshot={marketSnapshot} />;
      case "Signals":
        return <Signals />;
      case "Discovery Lab":
        return <DiscoveryLab />;
      case "Growth Engine":
        return <GrowthEngine />;
      case "Insights":
        return <Insights />;
      case "Market Monitor":
        return (
          <MarketMonitor
            marketSnapshot={marketSnapshot}
            snapshotStatus={snapshotStatus}
          />
        );
      case "Chat":
        return (
          <Chat
            marketSnapshot={marketSnapshot}
            snapshotStatus={snapshotStatus}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="app-shell">
      <nav className="top-tabs">
        {[
          "Dashboard",
          "Portfolio",
          "Signals",
          "Discovery Lab",
          "Growth Engine",
          "Insights",
          "Market Monitor",
          "Chat",
        ].map((tab) => (
          <button
            key={tab}
            className={activeTab === tab ? "active" : ""}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </nav>

      <main className="app-content">{renderTab()}</main>
    </div>
  );
}

