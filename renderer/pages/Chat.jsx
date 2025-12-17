import { useState } from "react";

export default function Chat() {
  const [question, setQuestion] = useState("");
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const TARGETS = {
    NVDA: 0.15,
    AVGO: 0.10,
    ASML: 0.08,
    MSTR: 0.07,
    HOOD: 0.05,
    APLD: 0.05,
    BMNR: 0.05,
    BTC: 0.30,
    ETH: 0.15,
  };

  const submit = async () => {
    if (!window.api?.chat) {
      setError("IPC bridge missing");
      return;
    }

    if (!question.trim()) return;

    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const result = await window.api.chat.ask(question, TARGETS);
      setResponse(result);
    } catch (e) {
      setError(e.message || "Chat request failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 32, maxWidth: 900 }}>
      <h1>Analyst</h1>

      <p style={{ opacity: 0.7 }}>
        Ask questions about your portfolio, risk, or rebalancing.
      </p>

      <textarea
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        rows={3}
        style={{ width: "100%", padding: 12, marginTop: 12 }}
        placeholder="Why did my portfolio move today?"
      />

      <button
        onClick={submit}
        disabled={loading}
        style={{ marginTop: 12, padding: "8px 16px" }}
      >
        {loading ? "Analyzing…" : "Ask"}
      </button>

      {error && (
        <div style={{ marginTop: 16, color: "red" }}>
          {error}
        </div>
      )}

      {response && (
        <div
          style={{
            marginTop: 24,
            padding: 16,
            background: "#0e1621",
            borderRadius: 6,
            whiteSpace: "pre-line",
          }}
        >
          <strong>Status:</strong> {response.status}
          <hr style={{ margin: "12px 0" }} />
          {response.response}
        </div>
      )}
    </div>
  );
}

