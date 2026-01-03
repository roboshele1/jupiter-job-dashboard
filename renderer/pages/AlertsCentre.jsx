// renderer/pages/AlertsCentre.jsx
import React from "react";

/**
 * ALERTS CENTRE — READ ONLY
 * V1 UI SHELL (NO LOGIC)
 * ----------------------
 * - ZERO engine access
 * - ZERO snapshot access
 * - ZERO IPC
 * - UI placeholder only
 * - Institutional layout consistency
 */

const COLORS = {
  bg: "#0B1220",
  panel: "#111827",
  border: "#1F2937",
  textPrimary: "#E5E7EB",
  textSecondary: "#9CA3AF",
};

export default function AlertsCentre() {
  return (
    <div
      style={{
        padding: "32px",
        maxWidth: "1200px",
        margin: "0 auto",
        background: COLORS.bg,
        color: COLORS.textPrimary,
        minHeight: "100vh",
      }}
    >
      <h1 style={{ marginBottom: "16px" }}>Alerts Centre</h1>

      <div
        style={{
          background: COLORS.panel,
          border: `1px solid ${COLORS.border}`,
          borderRadius: "12px",
          padding: "24px",
        }}
      >
        <p style={{ color: COLORS.textSecondary }}>
          Alerts Centre UI shell initialized.
        </p>
        <p style={{ color: COLORS.textSecondary, marginTop: "8px" }}>
          No logic. No data. No routing. No engine consumption.
        </p>
      </div>
    </div>
  );
}

