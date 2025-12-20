import React from "react";

export default function Growth() {
  return (
    <div style={{ padding: 32 }}>
      <h1 style={{ fontSize: 36, marginBottom: 16 }}>Growth</h1>

      <div
        style={{
          background: "rgba(255,255,255,0.03)",
          borderRadius: 12,
          padding: 20,
          maxWidth: 900,
        }}
      >
        <p style={{ marginBottom: 12 }}>
          Growth engine wired (read-only).
        </p>
        <p style={{ opacity: 0.7 }}>
          Forecasting disabled in V1.
        </p>
      </div>
    </div>
  );
}

