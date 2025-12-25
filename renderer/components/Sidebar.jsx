// renderer/components/Sidebar.jsx

import React from "react";
import { NavLink } from "react-router-dom";

const navItems = [
  { label: "Dashboard", path: "/dashboard" },
  { label: "Portfolio", path: "/portfolio" },
  { label: "Risk Centre", path: "/risk-centre" },
  { label: "Signals", path: "/signals" },
  { label: "Insights", path: "/insights" },
  { label: "Chat", path: "/chat" },
  { label: "Discovery Lab", path: "/discovery" },
  { label: "Growth Engine", path: "/growth" },
  { label: "Market Monitor", path: "/market" },
];

export default function Sidebar() {
  return (
    <div
      style={{
        width: "240px",
        padding: "24px 16px",
        borderRight: "1px solid rgba(255,255,255,0.06)",
        display: "flex",
        flexDirection: "column",
        gap: "6px",
      }}
    >
      <div
        style={{
          fontWeight: 700,
          fontSize: "20px",
          marginBottom: "24px",
          letterSpacing: "1px",
        }}
      >
        JUPITER
      </div>

      {navItems.map(item => (
        <NavLink
          key={item.path}
          to={item.path}
          style={({ isActive }) => ({
            padding: "10px 14px",
            borderRadius: "8px",
            textDecoration: "none",
            color: isActive ? "#fff" : "#9ca3af",
            background: isActive
              ? "rgba(255,255,255,0.08)"
              : "transparent",
            fontWeight: isActive ? 600 : 400,
          })}
        >
          {item.label}
        </NavLink>
      ))}
    </div>
  );
}

