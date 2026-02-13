export default function AssetSystemStatePanel({ state }) {
  const assets = Array.isArray(state?.assetSystemState)
    ? state.assetSystemState
    : [];

  return (
    <div style={{ marginTop: 14 }}>
      {/* Awareness (system-level) */}
      <div className="value" style={{ marginBottom: 10 }}>
        Awareness: <strong>{state?.awareness?.systemState || "UNKNOWN"}</strong>
      </div>

      {/* Asset posture */}
      {assets.length > 0 && (
        <>
          <div
            style={{
              fontWeight: 600,
              marginBottom: 6,
              fontSize: 13,
              letterSpacing: 0.3,
              opacity: 0.8,
            }}
          >
            Asset Posture (Engine)
          </div>

          {assets.map((a) => (
            <div
              key={a.symbol}
              style={{
                borderTop: "1px solid rgba(255,255,255,0.08)",
                padding: "6px 0",
                fontSize: 12,
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <span>
                <strong>{a.symbol}</strong>
              </span>
              <span style={{ opacity: 0.85 }}>
                {a.actionHint || "No signal"}
              </span>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
