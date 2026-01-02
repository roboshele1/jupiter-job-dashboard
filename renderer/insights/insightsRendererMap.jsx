import SignalsPanel from "./SignalsPanel";

export function renderInsightsBlock(insights) {
  if (!insights?.snapshot?.available) {
    return (
      <div className="insights-gate">
        <strong>Insights Unavailable</strong>
        <div>
          Signals are withheld until a complete portfolio snapshot is available.
        </div>
      </div>
    );
  }

  return (
    <>
      <section>
        <h3>Status</h3>
        <ul>
          <li>Status: {insights.meta.status}</li>
          <li>
            Generated:{" "}
            {new Date(insights.meta.generatedAt).toLocaleString()}
          </li>
        </ul>
      </section>

      <section>
        <h3>Snapshot</h3>
        <ul>
          <li>
            Total Value: $
            {Number(insights.snapshot.totalValue).toLocaleString()}
          </li>
        </ul>
      </section>

      <SignalsPanel signals={insights.signals} />
    </>
  );
}

