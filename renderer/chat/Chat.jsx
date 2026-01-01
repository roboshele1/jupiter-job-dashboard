import React from "react";

/**
 * Chat — Phase 10
 * ----------------
 * Purpose:
 * - Read-only rendering of observer-safe, schema-validated output
 * - NO logic
 * - NO IPC
 * - NO engine calls
 * - NO transformations
 *
 * This component is a pure consumer.
 */

export default function Chat({ data }) {
  if (!data) {
    return (
      <div style={styles.container}>
        <div style={styles.placeholder}>
          Chat available. No synthesized output yet.
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.section}>
        <div style={styles.label}>Summary</div>
        <div style={styles.text}>{data.summary}</div>
      </div>

      <div style={styles.section}>
        <div style={styles.label}>Disclaimer</div>
        <div style={styles.disclaimer}>{data.disclaimer}</div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: "16px",
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont",
    color: "#E6E6E6",
    backgroundColor: "#0F172A",
    height: "100%",
  },
  section: {
    marginBottom: "20px",
  },
  label: {
    fontSize: "12px",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "#94A3B8",
    marginBottom: "6px",
  },
  text: {
    fontSize: "14px",
    lineHeight: "1.6",
  },
  disclaimer: {
    fontSize: "12px",
    lineHeight: "1.5",
    color: "#94A3B8",
  },
  placeholder: {
    fontSize: "13px",
    color: "#64748B",
  },
};

