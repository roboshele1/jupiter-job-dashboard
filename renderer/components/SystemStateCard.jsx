import { useEffect, useState } from "react";

export default function SystemStateCard() {
  const [state, setState] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);

  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        if (!window?.jupiter?.invoke) return;

        const res = await window.jupiter.invoke("system:getState");
        if (!alive) return;

        setState(res);
        setLastRefresh(new Date());
      } catch (e) {
        console.error("[SYSTEM_STATE_CARD_ERROR]", e);
      }
    }

    load();
    const id = setInterval(load, 10000);

    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  if (!state) {
    return (
      <div className="card wide">
        <div className="label">SYSTEM STATE</div>
        <div className="value">Loading…</div>
      </div>
    );
  }

  const awareness = state?.awareness?.systemState || "UNKNOWN";
  const posture = state?.decision?.systemPosture || "UNKNOWN";
  const risk = state?.risk?.regime || "UNKNOWN";
  const signals = state?.signals?.available ? "ACTIVE" : "QUIET";

  return (
    <div className="card wide">
      <div className="label">SYSTEM STATE</div>

      <div className="value">
        Awareness: <strong>{awareness}</strong>
      </div>

      <div className="value">
        Posture: <strong>{posture}</strong>
      </div>

      <div className="value">
        Risk Regime: <strong>{risk}</strong>
      </div>

      <div className="value">
        Signals: <strong>{signals}</strong>
      </div>

      {lastRefresh && (
        <div style={{ opacity: 0.6, fontSize: 12, marginTop: 6 }}>
          refreshed {lastRefresh.toLocaleTimeString()}
        </div>
      )}
    </div>
  );
}

