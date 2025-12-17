import React from "react";

import Home from "./pages/Home";
import Portfolio from "./pages/Portfolio";
import Signals from "./pages/Signals";
import Discovery from "./pages/Discovery";
import Growth from "./pages/Growth";
import Insights from "./pages/Insights";
import Risk from "./pages/Risk";
import Chat from "./pages/Chat";

/**
 * JUPITER — App Router (AUTHORITATIVE)
 * Purpose: Bind activeTab → Page Mount
 */

export default function App({ activeTab }) {
  switch (activeTab) {
    case "dashboard":
      return <Home />;

    case "portfolio":
      return <Portfolio />;

    case "signals":
      return <Signals />;

    case "discovery":
      return <Discovery />;

    case "growth":
      return <Growth />;

    case "insights":
      return <Insights />;

    case "risk":
      return <Risk />;

    case "chat":
      return <Chat />;

    default:
      return <Home />;
  }
}

