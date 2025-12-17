import { NavLink } from "react-router-dom";
import "./TopNav.css";

const tabs = [
  { label: "System", path: "/system" },
  { label: "Portfolio", path: "/portfolio" },
  { label: "Risk", path: "/risk" },
  { label: "Growth", path: "/growth" },
  { label: "Discovery", path: "/discovery" },
  { label: "Analytics", path: "/analytics" },
  { label: "News", path: "/news" },
  { label: "Automation", path: "/automation" },
  { label: "Audit", path: "/audit" },
];

export default function TopNav() {
  return (
    <nav className="top-nav">
      <div className="brand">JUPITER</div>
      <div className="tabs">
        {tabs.map((t) => (
          <NavLink
            key={t.path}
            to={t.path}
            className={({ isActive }) =>
              isActive ? "tab active" : "tab"
            }
          >
            {t.label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

