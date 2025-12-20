import React from "react";
import { NavLink } from "react-router-dom";

const navItems = [
  { label: "Dashboard", path: "/" },
  { label: "Portfolio", path: "/portfolio" },
  { label: "Signals", path: "/signals" },
  { label: "Discovery Lab", path: "/discovery" },
  { label: "Growth Engine", path: "/growth" },
  { label: "Insights", path: "/insights" },
  { label: "Risk Centre", path: "/risk" },
  { label: "Market Monitor", path: "/market-monitor" },
  { label: "Chat", path: "/chat" },
];

export default function Sidebar() {
  return (
    <aside
      style={{
        width: "240px",
        background: "linear-gradient(180deg, #0b1020, #050812)",
        padding: "24px",
        color: "#fff",
      }}
    >
      <h2 style={{ marginBottom: "24px" }}>JUPITER</h2>

      <nav style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            style={({ isActive }) => ({
              color: "#fff",
              textDecoration: "none",
              fontWeight: isActive ? "600" : "400",
              opacity: isActive ? 1 : 0.7,
            })}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

