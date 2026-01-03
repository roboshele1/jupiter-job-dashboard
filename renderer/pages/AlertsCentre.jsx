// renderer/pages/AlertsCentre.jsx
import React from "react";
import { usePortfolioSnapshotStore } from "../state/portfolioSnapshotStore";

/**
 * ALERTS CENTRE — READ ONLY
 * V2 — RENDERER CONSUMPTION (NO UI CHANGE)
 * ---------------------------------------
 * - Reads alerts from snapshot (if present)
 * - NO rendering of alerts
 * - NO mutation
 * - NO IPC calls
 * - UI remains a shell
 */

const COLORS = {
  bg: "#0B1220",
  panel: "#111827",
  border: "#1F2937",
  textPrimary: "#E5E7EB",
  textSecondary: "#9CA3AF",
};

export default function AlertsCentre() {
  const snapshot = usePortfolioSnapshotStore((s) => s.snapshot);

  // Renderer-level read only (non-rendered, non-mutative)
  const _alertsEngine = snapshot?.alertsEngine ?? null;

  return (
    <div
      style={{
        padding: "32px",
        background: COLORS.bg,
        color: COLORS.textPrimary,
        minHeight: "100vh",
      }}
    >
      <h1>Alerts Centre</h1>
      <p style={{ color: COLORS.textSecondary }}>
        Alerts Centre UI shell. Alerts engine consumption is read-only and not rendered.
      </p>
    </div>
  );
}

