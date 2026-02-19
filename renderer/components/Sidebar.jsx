// renderer/components/Sidebar.jsx
// JUPITER — Sidebar Navigation

import React from "react";
import { NavLink } from "react-router-dom";

const items = [
  { label: "Dashboard",     path: "/dashboard" },
  { label: "Portfolio",     path: "/portfolio" },
  { label: "Signals",       path: "/signals"   },
  { label: "Discovery Lab", path: "/discovery" },
  { label: "Growth Engine", path: "/growth"    },
  { label: "Insights",      path: "/insights"  },
  { label: "Risk Centre",   path: "/risk"      },
  { label: "Market Monitor",path: "/market"    },
  { label: "Moonshot Lab",  path: "/moonshot"  },
  { label: "Goal Engine",   path: "/goal"      },
  { label: "Decisions",     path: "/decisions" },
];

export default function Sidebar() {
  return (
    <aside style={{ width: 220, padding: "16px 8px" }}>
      <nav style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {items.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            style={({ isActive }) => ({
              padding: "10px 12px",
              borderRadius: 6,
              textDecoration: "none",
              color: isActive ? "#fff" : "#b5b5b5",
              background: isActive ? "#1f2937" : "transparent",
              fontWeight: isActive ? 600 : 400
            })}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
