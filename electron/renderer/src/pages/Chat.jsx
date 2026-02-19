// ~/JUPITER/electron/renderer/src/pages/Chat.jsx

import { useState } from "react";
import { fetchLiveQuotes } from "../services/marketData";

/*
Phase 2B — Step 9 (System Hardening – Chat)
- Robust symbol parsing
- No false positives (e.g. PRICE)
- Deterministic, failure-safe behavior
*/

export default function Chat() {
  const [messages, setMessages] = useState([
    { role: "system", text: "Jupiter Chat — live market intelligence online." }
  ]);
  const [input, setInput] = useState("");

  function extractSymbol(text) {
    // Known universe hardening (can be expanded later)
    const KNOWN = ["AAPL", "MSFT", "NVDA", "TSLA", "AMZN", "META"];

    const upper = text.toUpperCase();
    return KNOWN.find(sym => upper.includes(sym)) || null;
  }

  async function handleSend() {
    if (!input.trim()) return;

    const userMsg = { role: "user", text: input };
    setMessages(m => [...m, userMsg]);
    setInput("");

    if (input.toLowerCase().includes("price")) {
      const symbol = extractSymbol(input);

      if (!symbol) {
        setMessages(m => [
          ...m,
          {
            role: "assistant",
            text: "Please specify a supported symbol (e.g. AAPL, MSFT, NVDA)."
          }
        ]);
        return;
      }

      try {
        const [quote] = await fetchLiveQuotes([symbol]);

        if (!quote || !quote.price) {
          setMessages(m => [
            ...m,
            {
              role: "assistant",
              text: `No live price available for ${symbol}.`
            }
          ]);
          return;
        }

        setMessages(m => [
          ...m,
          {
            role: "assistant",
            text: `${symbol} is trading at ${quote.price}.`
          }
        ]);
      } catch {
        setMessages(m => [
          ...m,
          { role: "assistant", text: "Market data unavailable." }
        ]);
      }

      return;
    }

    setMessages(m => [
      ...m,
      {
        role: "assistant",
        text:
          "I currently support live price queries (e.g. 'price of AAPL'). More intelligence coming next."
      }
    ]);
  }

  return (
    <div
      style={{
        padding: 16,
        height: "100%",
        display: "flex",
        flexDirection: "column"
      }}
    >
      <h2>Chat</h2>

      <div style={{ flex: 1, overflowY: "auto", marginBottom: 12 }}>
        {messages.map((m, idx) => (
          <div key={idx} style={{ marginBottom: 8 }}>
            <strong>{m.role}:</strong> {m.text}
          </div>
        ))}
      </div>

      <div style={{ display: "flex" }}>
        <input
          style={{ flex: 1, marginRight: 8 }}
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask about a live price (e.g. 'price of AAPL')"
        />
        <button onClick={handleSend}>Send</button>
      </div>
    </div>
  );
}

