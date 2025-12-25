// renderer/pages/Signals.jsx
import { useEffect, useState } from "react";

export default function Signals() {
  const [risk, setRisk] = useState(null);
  const [alerts, setAlerts] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [riskSnap, riskAlerts, dash] = await Promise.all([
          window.jupiter.getRiskSnapshot(),
          window.jupiter.getRiskAlerts(),
          window.jupiter.getDashboardSnapshot(),
        ]);

        setRisk(riskSnap);
        setAlerts(riskAlerts);
        setDashboard(dash);
      } catch (e) {
        console.error("Signals load failed", e);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  if (loading) {
    return <div className="page">Loading signals…</div>;
  }

  const signalCards = [];

  // ---- Risk-derived signals (deterministic) ----
  if (risk?.status === "OK") {
    if (risk.metrics.concentrationFlag) {
      signalCards.push({
        level: "warning",
        title: "Portfolio Concentration Elevated",
        body: `Top holding (${risk.metrics.topHolding}) exceeds safe concentration threshold.`,
      });
    }

    if (risk.metrics.btcDominanceFlag) {
      signalCards.push({
        level: "warning",
        title: "BTC Dominance Detected",
        body: "Bitcoin exposure dominates portfolio allocation.",
      });
    }

    if (
      !risk.metrics.concentrationFlag &&
      !risk.metrics.btcDominanceFlag
    ) {
      signalCards.push({
        level: "ok",
        title: "Risk Profile Stable",
        body: "No concentration or dominance risks detected.",
      });
    }
  }

  // ---- Alerts-derived signals ----
  if (alerts?.status === "NO_ALERTS") {
    signalCards.push({
      level: "ok",
      title: "No Active Risk Alerts",
      body: "All monitored thresholds are within acceptable bounds.",
    });
  }

  if (alerts?.alerts?.length > 0) {
    alerts.alerts.forEach(a => {
      signalCards.push({
        level: "alert",
        title: a.title,
        body: a.description,
      });
    });
  }

  // ---- Portfolio state signal ----
  if (dashboard?.totals?.delta === 0) {
    signalCards.push({
      level: "info",
      title: "Portfolio Delta Neutral",
      body: "No change detected since last snapshot.",
    });
  }

  // ---- Growth Engine (explicitly locked in V1) ----
  signalCards.push({
    level: "locked",
    title: "Growth Signals Locked",
    body: "Growth intelligence activates in Phase 2 (asymmetric scoring, momentum, expansion signals).",
  });

  return (
    <div className="page">
      <h1>Signals</h1>

      <div className="card-grid">
        {signalCards.map((s, i) => (
          <div key={i} className={`card signal ${s.level}`}>
            <h3>{s.title}</h3>
            <p>{s.body}</p>
          </div>
        ))}
      </div>

      <div className="footnote">
        Signals are read-only, deterministic, and derived from Portfolio and Risk engines.
      </div>
    </div>
  );
}

