import React, { useEffect } from "react";
import { useAlerts } from "../context/AlertContext";
import "./AlertPanel.css";

export default function AlertPanel() {
  const { alerts } = useAlerts();

  useEffect(() => {
    console.log("Alerts updated:", alerts);
  }, [alerts]);

  return (
    <div className="alert-panel">
      <h2>🔔 Jupiter Alerts</h2>

      {alerts.length === 0 ? (
        <p className="no-alerts">No alerts yet...</p>
      ) : (
        <ul className="alert-list">
          {alerts.map((alert, index) => (
            <li key={index} className="alert-item">
              <div className="alert-message">{alert.message}</div>
              <div className="alert-time">
                {new Date(alert.timestamp).toLocaleTimeString()}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

