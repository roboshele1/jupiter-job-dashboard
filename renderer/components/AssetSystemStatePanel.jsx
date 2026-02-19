export default function AssetSystemStatePanel({ state }) {
  const assets = Array.isArray(state?.assetSystemState)
    ? state.assetSystemState
    : [];

  const conviction = state?.convictionState || null;

  if (!assets.length) return null;

  return (
    <div style={{ marginTop: 14 }}>
      {/* Awareness (system-level) */}
      <div className="value" style={{ marginBottom: 10 }}>
        Awareness: <strong>{state?.awareness?.systemState || "UNKNOWN"}</strong>
      </div>

      {/* Asset posture */}
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

      {/* Conviction layer (read-only) */}
      {conviction?.available && (
        <div style={{ marginTop: 12 }}>
          <div
            style={{
              fontWeight: 600,
              marginBottom: 6,
              fontSize: 13,
              letterSpacing: 0.3,
            }}
          >
            Conviction Layer
          </div>

          <div style={{ fontSize: 12, marginBottom: 6 }}>
            System Conviction: <strong>{conviction.systemConviction}</strong>
          </div>

          {conviction.convictions.map((c) => (
            <div
              key={c.symbol}
              style={{
                borderTop: "1px solid rgba(255,255,255,0.08)",
                padding: "6px 0",
                fontSize: 12,
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <span>
                <strong>{c.symbol}</strong> — {c.stance}
              </span>
              <span style={{ opacity: 0.85 }}>
                {c.pressure} • score {Number(c.score).toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
