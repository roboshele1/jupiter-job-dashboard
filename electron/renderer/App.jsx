import React, { useState } from "react";
import Dashboard from "./pages/Dashboard";
import Portfolio from "./pages/Portfolio";

export default function App() {
  const [tab, setTab] = useState("dashboard");

  return (
    <div style={{ padding: "20px" }}>
      <nav style={{ marginBottom: "20px" }}>
        <button onClick={() => setTab("dashboard")}>Dashboard</button>
        <button onClick={() => setTab("portfolio")}>Portfolio</button>
      </nav>

      {tab === "dashboard" && <Dashboard />}
      {tab === "portfolio" && <Portfolio />}
    </div>
  );
}

