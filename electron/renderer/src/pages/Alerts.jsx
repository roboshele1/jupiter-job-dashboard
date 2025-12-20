import React, { useEffect, useState } from "react";

export default function Alerts() {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    if (window.jupiter?.getAlerts) {
      window.jupiter.getAlerts().then(setAlerts);
    }
  }, []);

  return (
    <div>
      <h1>Alerts</h1>

      {alerts.length === 0 ? (
        <div style={{ opacity: 0.7 }}>No active alerts</div>
      ) : (
        alerts.map((a, i) => (
          <div key={i} style={{ padding: 12, marginBottom: 8, border: "1px solid #333" }}>
            <strong>{a.type}</strong>
            <div>{a.message}</div>
          </div>
        ))
      )}
    </div>
  );
}

