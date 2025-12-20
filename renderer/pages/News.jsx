import React from "react";

export default function News() {
  return (
    <div style={{ padding: 32 }}>
      <h1 style={{ fontSize: 36, marginBottom: 12 }}>News</h1>
      <p style={{ opacity: 0.75, maxWidth: 700 }}>
        Live news ingestion is not yet enabled in v1.
        <br />
        This tab confirms feed contracts, layout, and navigation stability.
      </p>

      <div
        style={{
          marginTop: 24,
          padding: 16,
          borderRadius: 12,
          background: "rgba(255,255,255,0.04)",
        }}
      >
        <strong>Status:</strong> Waiting for data source activation
      </div>
    </div>
  );
}

