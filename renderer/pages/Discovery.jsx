import React from "react";

export default function Discovery() {
  return (
    <div style={{ padding: 32 }}>
      <h1 style={{ fontSize: 36, marginBottom: 16 }}>Discovery</h1>

      <div
        style={{
          background: "rgba(255,255,255,0.03)",
          borderRadius: 12,
          padding: 20,
          maxWidth: 900,
        }}
      >
        <p style={{ marginBottom: 12 }}>
          Discovery engine initialized.
        </p>
        <p style={{ opacity: 0.7 }}>
          No scans running in V1.
        </p>
      </div>
    </div>
  );
}

