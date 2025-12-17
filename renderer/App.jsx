import { HashRouter, Routes, Route, Link } from "react-router-dom";
import Dashboard from "./pages/Dashboard.jsx";
import Portfolio from "./pages/Portfolio.jsx";
import Signals from "./pages/Signals.jsx";
import MarketMonitor from "./pages/MarketMonitor.jsx";
import DiscoveryLab from "./pages/DiscoveryLab.jsx";
import GrowthEngine from "./pages/GrowthEngine.jsx";
import Insights from "./pages/Insights.jsx";
import RiskLab from "./pages/RiskLab.jsx";

export default function App() {
  return (
    <HashRouter>
      <nav style={{ padding: "12px", fontSize: "16px" }}>
        <Link to="/">Dashboard</Link>{" "}
        <Link to="/portfolio">Portfolio</Link>{" "}
        <Link to="/signals">Signals</Link>{" "}
        <Link to="/market">Market Monitor</Link>{" "}
        <Link to="/discovery">Discovery Lab</Link>{" "}
        <Link to="/growth">Growth Engine</Link>{" "}
        <Link to="/insights">Insights</Link>{" "}
        <Link to="/risk">Risk Lab</Link>
      </nav>

      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/portfolio" element={<Portfolio />} />
        <Route path="/signals" element={<Signals />} />
        <Route path="/market" element={<MarketMonitor />} />
        <Route path="/discovery" element={<DiscoveryLab />} />
        <Route path="/growth" element={<GrowthEngine />} />
        <Route path="/insights" element={<Insights />} />
        <Route path="/risk" element={<RiskLab />} />
      </Routes>
    </HashRouter>
  );
}

