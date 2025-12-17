import React from "react";

export default function Home() {
  return (
    <div style={styles.container}>
      <h1 style={styles.title}>JUPITER — System Health</h1>

      <section style={styles.card}>
        <h2>Engine Status</h2>
        <p>✔ Renderer connected</p>
        <p>✔ Engine responding</p>
        <p>✔ Live data pipeline active</p>
      </section>

      <section style={styles.card}>
        <h2>Navigation Spine</h2>
        <p>✔ Top navigation mounted</p>
        <p>✔ Persistent layout confirmed</p>
        <p>✔ Module shells ready</p>
      </section>

      <section style={styles.card}>
        <h2>System Mode</h2>
        <p>Operational — awaiting module wiring</p>
      </section>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    padding: "32px",
    background: "#020617",
    color: "#ffffff",
    fontFamily: "Inter, system-ui, sans-serif"
  },
  title: {
    marginBottom: "24px"
  },
  card: {
    background: "rgba(255,255,255,0.05)",
    padding: "20px",
    borderRadius: "14px",
    marginBottom: "20px"
  }
};

