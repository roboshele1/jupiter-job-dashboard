// renderer/pages/Insights.jsx

import React, { useEffect, useState } from "react";
import { buildInsightsSnapshot } from "../insights/insightsPipeline.js";
import SignalsPanel from "../insights/SignalsPanel.jsx";

export default function Insights() {
  const [data, setData] = useState(null);

  useEffect(() => {
    window.api.getPortfolioValuation().then(snapshot => {
      buildInsightsSnapshot(snapshot).then(out => {
        setData(out);
      });
    });
  }, []);

  if (!data) {
    return <div style={{ padding: 16 }}>Loading insights…</div>;
  }

  const signalsAvailable = Array.isArray(data.signals) && data.signals.length > 0;

  return (
    <div style={{ padding: 16 }}>
      {!signalsAvailable && (
        <div style={{ opacity: 0.7, marginBottom: 12 }}>
          Signals are temporarily withheld until a valid snapshot is available.
        </div>
      )}

      <SignalsPanel insights={data} />
    </div>
  );
}

