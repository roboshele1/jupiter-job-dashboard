// renderer/pages/AlertsCentre.jsx
// ALERTS CENTRE — READ ONLY (V3)
// Renderer consumes Alerts IPC snapshot.
// No rendering, no mutation, no logic.

import React, { useEffect } from "react";

export default function AlertsCentre() {
  useEffect(() => {
    // IPC read-only consumption
    window.api?.invoke("alerts:getSnapshot").then((snapshot) => {
      // Intentionally unused — existence confirms wiring
      void snapshot;
    });
  }, []);

  return (
    <div style={{ padding: "32px" }}>
      <h1>Alerts Centre</h1>
      <p style={{ opacity: 0.6 }}>
        Alerts Centre ready. Awaiting UI activation.
      </p>
    </div>
  );
}

