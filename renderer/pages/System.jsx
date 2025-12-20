
import React from "react";

export default function System() {
  return (
    <div style={{ padding: 32 }}>
      <h1 style={{ fontSize: 36, marginBottom: 16 }}>System</h1>

      <div
        style={{
          background: "rgba(255,255,255,0.03)",
          borderRadius: 12,
          padding: 20,
          maxWidth: 900,
        }}
      >
        <p style={{ marginBottom: 12 }}>
          IPC contracts frozen.
        </p>
        <p style={{ opacity: 0.7 }}>
          Deterministic snapshots enforced.
        </p>
      </div>
    </div>
  );
}

