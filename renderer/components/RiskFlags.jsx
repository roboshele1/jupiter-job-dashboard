// renderer/components/RiskFlags.jsx

import React from "react";

export default function RiskFlags({ metrics }) {
  return (
    <div style={styles.container}>
      {metrics.concentrationFlag && (
        <div style={styles.flag}>
          ⚠️ High concentration in {metrics.topHolding}
        </div>
      )}

      {metrics.btcDominanceFlag && (
        <div style={styles.flag}>
          ⚠️ BTC dominance exceeds threshold
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    marginTop: "12px",
  },
  flag: {
    color: "#f87171",
    fontSize: "14px",
    marginBottom: "6px",
  },
};

