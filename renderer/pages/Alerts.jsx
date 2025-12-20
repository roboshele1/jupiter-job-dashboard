import React from "react";

export default function Alerts() {
  return (
    <div className="page">
      <h1>Alerts</h1>
      <ul>
        <li>✔ Concentration threshold alerts</li>
        <li>✔ Risk signal events (session-scoped)</li>
        <li>✔ Read-only history</li>
      </ul>
      <p className="muted">No push, email, or automation in V1.</p>
    </div>
  );
}

