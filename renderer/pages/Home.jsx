import React from "react";
import Dashboard from "./Dashboard";
import Portfolio from "./Portfolio";
import Signals from "./Signals";
import DiscoveryLab from "./DiscoveryLab";
import GrowthEngine from "./GrowthEngine";
import Insights from "./Insights";
import RiskCentre from "./RiskCentre";
import MarketMonitor from "./MarketMonitor";
import Chat from "./Chat";

/**
 * Home.jsx
 * -----------------------------
 * PURE SHELL / ROUTER ONLY
 * - No engine imports
 * - No IPC
 * - No portfolio logic
 */

export default function Home({ activeTab }) {
  switch (activeTab) {
    case "dashboard":
      return <Dashboard />;

    case "portfolio":
      return <Portfolio />;

    case "signals":
      return <Signals />;

    case "discovery":
      return <DiscoveryLab />;

    case "growth":
      return <GrowthEngine />;

    case "insights":
      return <Insights />;

    case "risk":
      return <RiskCentre />;

    case "market":
      return <MarketMonitor />;

    case "chat":
      return <Chat />;

    default:
      return null;
  }
}

