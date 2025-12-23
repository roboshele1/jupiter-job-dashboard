// renderer/pages/Chat.jsx
/**
 * Chat — Phase 2
 * ----------------
 * Read-only observer of Dashboard truth.
 * Hydrates snapshot data asynchronously.
 * No inference, no actions, no mutations.
 */

import React, { useEffect, useState } from "react";
import { readDashboardTruth } from "../stores/dashboardRead";

export default function Chat() {
  const [dashboardTruth, setDashboardTruth] = useState(null);
  const [status, setStatus] = useState("hydrating");

  useEffect(() => {
    let mounted = true;

    async function hydrate() {
      try {
        const truth = await readDashboardTruth();

        if (mounted) {
          setDashboardTruth(truth);
          setStatus("ready");
        }
      } catch (error) {
        console.error("Chat hydration failed:", error);

        if (mounted) {
          setStatus("error");
        }
      }
    }

    hydrate();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div style={{ padding: 32 }}>
      <h1>Chat</h1>
      <p style={{ opacity: 0.7 }}>
        Read-only Dashboard context (Phase 2).
      </p>

      {status === "hydrating" && (
        <div style={{ marginTop: 24, opacity: 0.6 }}>
          Hydrating dashboard truth…
        </div>
      )}

      {status === "error" && (
        <div style={{ marginTop: 24, color: "#F44336" }}>
          Failed to hydrate dashboard truth.
        </div>
      )}

      {status === "ready" && (
        <div
          style={{
            marginTop: 24,
            padding: 20,
            borderRadius: 12,
            background: "rgba(255,255,255,0.04)",
            fontFamily: "monospace",
            whiteSpace: "pre-wrap",
          }}
        >
          <strong>Dashboard Truth</strong>
          <pre style={{ marginTop: 12 }}>
            {JSON.stringify(dashboardTruth, null, 2)}
          </pre>

          <div style={{ marginTop: 16, opacity: 0.5 }}>
            Chat is operating in observer mode.
            <br />
            No inference or actions are permitted in Phase 2.
          </div>
        </div>
      )}
    </div>
  );
}

