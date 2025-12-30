import React from "react";

const badgeStyle = (level) => {
  const map = {
    High: "#2ecc71",
    Medium: "#f1c40f",
    Low: "#e67e22",
  };
  return {
    display: "inline-block",
    padding: "0.2rem 0.6rem",
    borderRadius: "6px",
    fontSize: "0.8rem",
    background: map[level] || "#777",
    color: "#000",
    fontWeight: 600,
  };
};

export default function DiscoveryLab() {
  return (
    <div style={{ padding: "2rem", maxWidth: "1200px" }}>
      <h1>Discovery Lab</h1>
      <p style={{ opacity: 0.8 }}>
        Read-only market discovery surface (Phase 2C).
      </p>

      {/* PURPOSE */}
      <section style={{ marginTop: "2rem" }}>
        <h2>Purpose</h2>
        <p>
          Discovery Lab surfaces <strong>potential assets, themes, and market ideas</strong>{" "}
          that exist <em>outside</em> the current portfolio. This module does not
          execute trades, alter portfolio state, or generate recommendations.
        </p>
        <p style={{ opacity: 0.7 }}>
          Phase 2C adds ranked static discovery, rationale visibility, and UX
          scaffolding. No intelligence engines are active.
        </p>
      </section>

      {/* STATUS */}
      <section style={{ marginTop: "2.5rem" }}>
        <h2>Status</h2>
        <ul>
          <li>Mode: Read-only</li>
          <li>Phase: 2C (UI + Ranked Static Discovery)</li>
          <li>Engines: None</li>
          <li>Data Source: Mock / Static</li>
        </ul>
      </section>

      {/* FILTERS (NON-FUNCTIONAL) */}
      <section style={{ marginTop: "3rem" }}>
        <h2>Filters (Preview)</h2>
        <div style={{ display: "flex", gap: "1rem", opacity: 0.6 }}>
          <select disabled>
            <option>Theme: All</option>
          </select>
          <select disabled>
            <option>Asset Class: All</option>
          </select>
          <select disabled>
            <option>Confidence: All</option>
          </select>
        </div>
      </section>

      {/* EMERGING THEMES */}
      <section style={{ marginTop: "3rem" }}>
        <h2>Emerging Themes</h2>
        <table style={{ width: "100%", marginTop: "1rem" }}>
          <thead>
            <tr>
              <th align="left">Theme</th>
              <th align="left">Description</th>
              <th align="left">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>AI Infrastructure</td>
              <td>Rising demand for compute, networking, and data pipelines</td>
              <td>Watching</td>
            </tr>
            <tr>
              <td>Digital Assets</td>
              <td>Increased institutional participation and ETF exposure</td>
              <td>Monitoring</td>
            </tr>
            <tr>
              <td>Energy Transition</td>
              <td>Grid modernization and power demand growth</td>
              <td>Early</td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* RANKED DISCOVERY */}
      <section style={{ marginTop: "3rem" }}>
        <h2>Ranked Market Discovery</h2>
        <table style={{ width: "100%", marginTop: "1rem" }}>
          <thead>
            <tr>
              <th align="left">Rank</th>
              <th align="left">Symbol</th>
              <th align="left">Theme</th>
              <th align="left">Why It Surfaced</th>
              <th align="left">Confidence</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>#1</td>
              <td>SMCI</td>
              <td>AI Infrastructure</td>
              <td>Direct beneficiary of hyperscaler and enterprise compute expansion</td>
              <td><span style={badgeStyle("High")}>High</span></td>
            </tr>
            <tr>
              <td>#2</td>
              <td>COIN</td>
              <td>Digital Assets</td>
              <td>Leverage to spot ETF flows and rising institutional crypto access</td>
              <td><span style={badgeStyle("Medium")}>Medium</span></td>
            </tr>
            <tr>
              <td>#3</td>
              <td>URA</td>
              <td>Energy Transition</td>
              <td>Renewed nuclear investment amid global energy security concerns</td>
              <td><span style={badgeStyle("Medium")}>Medium</span></td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* WATCHLIST */}
      <section style={{ marginTop: "3rem" }}>
        <h2>Watchlist Candidates</h2>
        <table style={{ width: "100%", marginTop: "1rem" }}>
          <thead>
            <tr>
              <th align="left">Symbol</th>
              <th align="left">Rationale</th>
              <th align="left">Confidence</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>ARM</td>
              <td>Strategic control point in mobile and AI chip ecosystems</td>
              <td><span style={badgeStyle("Medium")}>Medium</span></td>
            </tr>
            <tr>
              <td>NEE</td>
              <td>Scale leader in renewable power generation and storage</td>
              <td><span style={badgeStyle("Medium")}>Medium</span></td>
            </tr>
            <tr>
              <td>ETH</td>
              <td>Core smart-contract platform with increasing institutional usage</td>
              <td><span style={badgeStyle("High")}>High</span></td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* FOOTER */}
      <section style={{ marginTop: "3rem", opacity: 0.6 }}>
        <p>
          ⚠️ Phase 2C complete. All outputs are static. No scoring models, live feeds,
          or portfolio relevance engines are active.
        </p>
      </section>
    </div>
  );
}

