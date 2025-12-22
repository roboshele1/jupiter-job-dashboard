import { useEffect, useState } from "react";

export default function Dashboard() {
  const [snapshot, setSnapshot] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      if (!window.jupiter?.getMarketSnapshot) {
        setError("IPC not ready");
        return;
      }

      try {
        const data = await window.jupiter.getMarketSnapshot();
        setSnapshot(data);
      } catch (e) {
        setError(e.message);
      }
    }

    load();
  }, []);

  if (error) {
    return <pre style={{ color: "red" }}>{error}</pre>;
  }

  if (!snapshot) {
    return <div style={{ padding: 20 }}>Loading snapshot…</div>;
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Dashboard OK</h1>
      <pre>{JSON.stringify(snapshot, null, 2)}</pre>
    </div>
  );
}

