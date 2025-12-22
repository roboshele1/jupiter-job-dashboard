import { useState, useEffect } from "react";

export default function Chat({ marketSnapshot, snapshotStatus }) {
  const [messages, setMessages] = useState([
    {
      role: "system",
      content:
        "JUPITER Chat initialized. Ask about your portfolio, risk, or market context.",
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);

  const [input, setInput] = useState("");

  const respond = (text) => {
    if (!marketSnapshot) {
      return "Market snapshot is currently unavailable.";
    }

    const lower = text.toLowerCase();

    if (lower.includes("btc")) {
      const btc = marketSnapshot.crypto?.find(
        (c) => c.symbol === "BTC-USD"
      );
      return btc
        ? `BTC is trading at $${btc.price.toLocaleString()}`
        : "BTC price not found in snapshot.";
    }

    if (lower.includes("eth")) {
      const eth = marketSnapshot.crypto?.find(
        (c) => c.symbol === "ETH-USD"
      );
      return eth
        ? `ETH is trading at $${eth.price.toLocaleString()}`
        : "ETH price not found in snapshot.";
    }

    if (lower.includes("live")) {
      return snapshotStatus === "LIVE"
        ? "Yes — the market snapshot is live."
        : "Market snapshot is not live.";
    }

    if (lower.includes("update") || lower.includes("timestamp")) {
      return `Last market update: ${new Date(
        marketSnapshot.timestamp * 1000
      ).toLocaleTimeString()}`;
    }

    return "I can answer questions about live prices, snapshot status, and portfolio context.";
  };

  const send = () => {
    if (!input.trim()) return;

    const userMsg = {
      role: "user",
      content: input,
      timestamp: new Date().toLocaleTimeString(),
    };

    const systemMsg = {
      role: "system",
      content: respond(input),
      timestamp: new Date().toLocaleTimeString(),
    };

    setMessages((m) => [...m, userMsg, systemMsg]);
    setInput("");
  };

  return (
    <div className="chat-shell">
      <div className="chat-messages">
        {messages.map((m, i) => (
          <div key={i} className={`chat-row ${m.role}`}>
            <div className="chat-meta">
              {m.role.toUpperCase()} · {m.timestamp}
            </div>
            <div className="chat-content">{m.content}</div>
          </div>
        ))}
      </div>

      <div className="chat-input">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask JUPITER…"
          onKeyDown={(e) => e.key === "Enter" && send()}
        />
        <button onClick={send}>Send</button>
      </div>
    </div>
  );
}

