// renderer/components/Sidebar.jsx
// JUPITER — Sidebar Navigation with Auth

import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../AuthContext";

const items = [
  { label: "Dashboard",      path: "/dashboard"  },
  { label: "Portfolios",     path: "/portfolios" },
  { label: "Signals",        path: "/signals"    },
  { label: "Discovery Lab",  path: "/discovery"  },
  { label: "Insights",       path: "/insights"   },
  { label: "Risk Centre",    path: "/risk"       },
  { label: "Goal Engine",    path: "/goal"       },
  { label: "Monte Carlo",    path: "/monte-carlo" },
  { label: "DCA Audit",      path: "/audit" },


  { label: "Jupiter AI",     path: "/jupiterai"  },
];

const C = {
  border: "#1e2530",
  muted:  "#6b7280",
  sub:    "#94a3b8",
  green:  "#22c55e",
  mono:   "'IBM Plex Mono', monospace",
};

export default function Sidebar() {
  const { user, syncing, signOut } = useAuth();

  const initials = user?.displayName
    ? user.displayName.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)
    : user?.email?.slice(0, 2).toUpperCase() || "??";

  return (
    <aside style={{
      width: 220, padding: "16px 8px",
      display: "flex", flexDirection: "column",
      borderRight: `1px solid ${C.border}`,
      fontFamily: C.mono,
    }}>
      {/* Logo */}
      <div style={{
        padding: "8px 12px 16px",
        fontSize: 13, fontWeight: 900, color: "#e2e8f0",
        letterSpacing: "-0.01em", borderBottom: `1px solid ${C.border}`,
        marginBottom: 12,
      }}>
        ◈ JUPITER
      </div>

      {/* Nav */}
      <nav style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1 }}>
        {items.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            style={({ isActive }) => ({
              padding: "9px 12px",
              borderRadius: 6,
              textDecoration: "none",
              color: isActive ? "#fff" : "#b5b5b5",
              background: isActive ? "#1f2937" : "transparent",
              fontWeight: isActive ? 600 : 400,
              fontSize: 12,
              fontFamily: C.mono,
            })}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Sync indicator */}
      {syncing && (
        <div style={{
          padding: "6px 12px", fontSize: 10, color: C.muted,
          display: "flex", alignItems: "center", gap: 6,
        }}>
          <span style={{ color: "#f59e0b" }}>●</span> Syncing…
        </div>
      )}

      {/* User badge */}
      {user && (
        <div style={{
          borderTop: `1px solid ${C.border}`,
          paddingTop: 12, marginTop: 4,
          padding: "12px 8px 4px",
        }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "8px 10px", borderRadius: 8,
            background: "#0d1117",
          }}>
            {/* Avatar */}
            <div style={{
              width: 28, height: 28, borderRadius: "50%",
              background: "#3b82f6", display: "flex",
              alignItems: "center", justifyContent: "center",
              fontSize: 10, fontWeight: 800, color: "#fff",
              flexShrink: 0,
            }}>{initials}</div>

            {/* Email */}
            <div style={{ overflow: "hidden", flex: 1 }}>
              <div style={{
                fontSize: 10, color: "#e2e8f0", fontWeight: 600,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {user.displayName || user.email?.split("@")[0]}
              </div>
              <div style={{
                fontSize: 9, color: C.green, marginTop: 1,
              }}>● synced</div>
            </div>
          </div>

          {/* Sign out */}
          <button
            onClick={signOut}
            style={{
              width: "100%", marginTop: 6, padding: "6px 0",
              background: "none", border: `1px solid ${C.border}`,
              color: C.muted, borderRadius: 6, fontFamily: C.mono,
              fontSize: 10, cursor: "pointer",
            }}
          >Sign Out</button>
        </div>
      )}
    </aside>
  );
}
