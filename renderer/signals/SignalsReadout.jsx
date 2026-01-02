import React, { useEffect, useState } from "react";

export default function SignalsReadout() {
  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const result = await window.api.invoke("notifications:getLatest");
        if (mounted) setNotifications(Array.isArray(result) ? result : []);
      } catch (e) {
        if (mounted) setError(e.message || "Failed to load notifications");
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  if (error) {
    return <div style={{ padding: 16 }}>Error: {error}</div>;
  }

  if (!notifications.length) {
    return <div style={{ padding: 16 }}>No signals yet.</div>;
  }

  return (
    <div style={{ padding: 16 }}>
      <h3>Signals</h3>
      <ul>
        {notifications.map((n, i) => (
          <li key={i}>
            <strong>{n.type}</strong> · {n.severity} · {String(n.value)}
          </li>
        ))}
      </ul>
    </div>
  );
}

