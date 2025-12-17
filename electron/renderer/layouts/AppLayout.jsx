import React, { useState } from "react";

export default function FloatingNLP() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [response, setResponse] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    setResponse(`You asked: ${input}`);
    setInput("");
  };

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          style={{
            position: "fixed",
            bottom: "20px",
            right: "20px",
            zIndex: 9999,
            width: "60px",
            height: "60px",
            background: "#4b7bec",
            color: "white",
            borderRadius: "50%",
            border: "none",
            fontSize: "28px",
            cursor: "pointer",
          }}
        >
          💬
        </button>
      )}

      {open && (
        <div
          style={{
            position: "fixed",
            bottom: "20px",
            right: "20px",
            width: "360px",
            padding: "20px",
            background: "#111",
            borderRadius: "16px",
            border: "1px solid #444",
            zIndex: 9999,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "12px",
            }}
          >
            <strong>Jupiter NLP</strong>
            <button
              onClick={() => setOpen(false)}
              style={{
                background: "transparent",
                color: "white",
                border: "none",
                cursor: "pointer",
                fontSize: "20px",
              }}
            >
              ×
            </button>
          </div>

          {response && (
            <div
              style={{
                background: "#222",
                padding: "12px",
                borderRadius: "10px",
                marginBottom: "10px",
                fontSize: "14px",
              }}
            >
              {response}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Jupiter anything…"
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "6px",
                border: "1px solid #333",
                background: "#222",
                color: "white",
              }}
            />
          </form>
        </div>
      )}
    </>
  );
}

