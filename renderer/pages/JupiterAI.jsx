// renderer/pages/JupiterAI.jsx
// JUPITER AI — Adaptive Decision Intelligence Layer
// Powered by Claude. Grounded in live Jupiter data.
// NOT financial advice.

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const BG       = "#060910";
const SURFACE  = "#0d1117";
const BORDER   = "#1a2133";
const BORDER2  = "#243044";
const GREEN    = "#00ff88";
const BLUE     = "#4da6ff";
const AMBER    = "#ffb84d";
const RED      = "#ff4d6a";
const MUTED    = "#4a5568";
const TEXT     = "#e2e8f0";
const TEXTDIM  = "#8896a8";
const MONO     = { fontFamily: "'IBM Plex Mono', monospace" };

const GOAL      = 1_000_000;
const GOAL_YEAR = 2037;

const BASE_CAGR = {
  CNSWF:26, CSU:26, NVDA:35, ASML:22, AVGO:28, NOW:24,
  MA:18, HOOD:20, APLD:22, BMNR:15, BTC:30, ETH:25,
  MSTR:28, WBTC:30, default:15,
};

const REGIME_MODIFIER = {
  RISK_ON:+3, MILD_RISK_ON:+1.5, NEUTRAL:0, MILD_RISK_OFF:-2, RISK_OFF:-5,
};

const KELLY_MULT_TABLE = {
  RISK_ON:0.30, MILD_RISK_ON:0.275, NEUTRAL:0.25, MILD_RISK_OFF:0.175, RISK_OFF:0.10,
};

// ─── SUGGESTED QUESTIONS ─────────────────────────────────────────────────────
const SUGGESTIONS = [
  "Is now a good time to buy NVDA?",
  "Which holding has the best risk/reward right now?",
  "Am I on track to hit $1M by 2037?",
  "Should I trim any overweight positions?",
  "What is a Kelly fraction?",
  "How does market regime affect my portfolio?",
  "Which position is dragging my CAGR the most?",
  "What is an ETF?",
  "Explain my top LCPE pick in plain English",
  "What should I do with my monthly DCA this month?",
];

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function fmtUSD(n) {
  if (!n && n !== 0) return "—";
  return "$" + Number(n).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}
function fmtPct(n) { return (n == null ? "—" : n.toFixed(1) + "%"); }
function fmtNum(n, d = 2) { return n == null ? "—" : Number(n).toFixed(d); }

function getCAGR(symbol, regime = "NEUTRAL") {
  const base = BASE_CAGR[symbol?.toUpperCase()] ?? BASE_CAGR.default;
  const mod  = REGIME_MODIFIER[regime] ?? 0;
  return Math.max(5, base + mod);
}

// ─── CONTEXT BUILDER — the intelligence layer ─────────────────────────────────
// This is what makes Jupiter AI powerful: every question is answered
// with full live portfolio context, not generic finance knowledge.
function buildSystemPrompt({ positions, portfolioValue, kelly, risk, regime, snap }) {
  const yearsLeft    = Math.max(0.1, GOAL_YEAR - new Date().getFullYear());
  const requiredCAGR = portfolioValue
    ? ((Math.pow(GOAL / portfolioValue, 1 / yearsLeft) - 1) * 100).toFixed(1)
    : "unknown";
  const kellyMult    = KELLY_MULT_TABLE[regime] ?? 0.25;
  const regimeMod    = REGIME_MODIFIER[regime] ?? 0;

  // Build per-holding context
  const holdingLines = (positions || []).map(p => {
    const cagr     = getCAGR(p.symbol, regime);
    const weight   = portfolioValue ? ((p.liveValue / portfolioValue) * 100).toFixed(1) : "?";
    const pnl      = p.liveValue && p.costBasis ? (((p.liveValue - p.costBasis) / p.costBasis) * 100).toFixed(1) : "?";
    const ka       = (kelly?.actions || []).find(a => a.symbol === p.symbol);
    return `  - ${p.symbol}: value=${fmtUSD(p.liveValue)}, weight=${weight}%, regime-adj CAGR=${cagr}%, Kelly action=${ka?.action || "HOLD"}, P&L=${pnl}%`;
  }).join("\n");

  const riskSummary = risk ? `
  - VIX: ${risk.vix ?? "?"}
  - Regime: ${regime}
  - Kelly heat: ${kelly?.heatCheck?.status ?? "?"}
  - Regime modifier on all CAGRs: ${regimeMod >= 0 ? "+" : ""}${regimeMod}%
  - Kelly multiplier at this regime: ${kellyMult}× fractional
` : "  - Risk data unavailable";

  return `You are JUPITER AI — the embedded decision intelligence engine inside Jupiter, a personal portfolio management application targeting $1,000,000 by ${GOAL_YEAR}.

You are NOT a generic finance chatbot. You have access to the user's LIVE portfolio data, market regime, Kelly sizing, and LCPE rankings. Every answer you give must be grounded in this real data first, then augmented with your broader financial knowledge.

ADAPTATION RULE (critical):
- If the question is basic/educational (e.g. "what is an ETF", "explain Kelly criterion"), answer clearly in plain English. Be a brilliant teacher.
- If the question is portfolio-specific or strategic (e.g. "should I buy NVDA", "am I on track"), lead with the live data, then add institutional-grade reasoning.
- Always match the user's level of sophistication. Never talk down. Never over-complicate a simple question.

LIVE PORTFOLIO SNAPSHOT (as of now):
  - Total value: ${fmtUSD(portfolioValue)}
  - Goal: ${fmtUSD(GOAL)} by ${GOAL_YEAR}
  - Years remaining: ${yearsLeft.toFixed(1)}
  - Required CAGR to hit goal: ${requiredCAGR}%
  - Current market regime: ${regime}

HOLDINGS:
${holdingLines || "  - No holdings data available"}

MARKET & RISK:
${riskSummary}

RESPONSE FORMAT:
- Be direct and precise. No filler. No fluff.
- For portfolio questions: lead with a verdict (BUY / HOLD / TRIM / MONITOR), then back it with data.
- For educational questions: give a crisp definition, then a concrete example, then connect it to Jupiter if relevant.
- Use plain paragraph prose. You may use short bullet points for comparisons or lists of factors — but never more than 5 bullets.
- Never use markdown headers (##) or bold (**text**) — this renders in a terminal-style chat interface.
- Keep responses under 300 words unless the question genuinely requires depth.
- End every portfolio-specific answer with one concrete next action the user can take.

GUARDRAIL: You are a decision support engine, not a licensed financial advisor. Every response that contains a portfolio recommendation must end with: "[Not financial advice]"

TONE: Institutional precision. Zero emotional bias. Zero favoritism toward any asset. Data rules.`;
}

// ─── MESSAGE BUBBLE ──────────────────────────────────────────────────────────
function Bubble({ msg }) {
  const isUser = msg.role === "user";
  const isErr  = msg.role === "error";

  return (
    <div style={{
      display: "flex",
      justifyContent: isUser ? "flex-end" : "flex-start",
      marginBottom: 16,
      animation: "fadeSlideIn 0.25s ease",
    }}>
      {!isUser && (
        <div style={{
          width: 28, height: 28, borderRadius: "50%",
          background: `linear-gradient(135deg, ${BLUE}33, ${GREEN}33)`,
          border: `1px solid ${BLUE}55`,
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0, marginRight: 10, marginTop: 2,
          ...MONO, fontSize: 9, color: BLUE, letterSpacing: 0,
        }}>AI</div>
      )}
      <div style={{
        maxWidth: "72%",
        padding: "12px 16px",
        borderRadius: isUser ? "12px 12px 2px 12px" : "2px 12px 12px 12px",
        background: isUser
          ? `linear-gradient(135deg, ${BLUE}22, ${BLUE}11)`
          : isErr ? `${RED}11` : SURFACE,
        border: `1px solid ${isUser ? BLUE + "44" : isErr ? RED + "44" : BORDER}`,
        ...MONO,
        fontSize: 12.5,
        lineHeight: 1.7,
        color: isErr ? RED : TEXT,
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
      }}>
        {msg.content}
        {msg.role === "assistant" && msg.content.includes("[Not financial advice]") && (
          <div style={{
            marginTop: 10,
            paddingTop: 8,
            borderTop: `1px solid ${BORDER}`,
            fontSize: 10,
            color: AMBER,
            letterSpacing: "0.05em",
          }}>
            ⚠ NOT FINANCIAL ADVICE — FOR DECISION SUPPORT ONLY
          </div>
        )}
      </div>
    </div>
  );
}

// ─── TYPING INDICATOR ────────────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", marginBottom: 16 }}>
      <div style={{
        width: 28, height: 28, borderRadius: "50%",
        background: `linear-gradient(135deg, ${BLUE}33, ${GREEN}33)`,
        border: `1px solid ${BLUE}55`,
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0, marginRight: 10,
        ...MONO, fontSize: 9, color: BLUE,
      }}>AI</div>
      <div style={{
        padding: "14px 18px",
        borderRadius: "2px 12px 12px 12px",
        background: SURFACE,
        border: `1px solid ${BORDER}`,
        display: "flex", gap: 5, alignItems: "center",
      }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: 6, height: 6, borderRadius: "50%",
            background: BLUE,
            animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
          }} />
        ))}
      </div>
    </div>
  );
}

// ─── CONTEXT BADGE ───────────────────────────────────────────────────────────
function ContextBadge({ label, value, color = BLUE }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", gap: 2,
      padding: "8px 12px",
      borderRadius: 6,
      background: `${color}0d`,
      border: `1px solid ${color}33`,
      minWidth: 90,
    }}>
      <span style={{ ...MONO, fontSize: 9, color: MUTED, letterSpacing: "0.08em", textTransform: "uppercase" }}>{label}</span>
      <span style={{ ...MONO, fontSize: 12, color, fontWeight: 700 }}>{value}</span>
    </div>
  );
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
export default function JupiterAI() {
  const [messages, setMessages]     = useState([]);
  const [input, setInput]           = useState("");
  const [loading, setLoading]       = useState(false);
  const [data, setData]             = useState(null);
  const [dataLoading, setDataLoading] = useState(true);
  const bottomRef                   = useRef(null);
  const inputRef                    = useRef(null);
  const conversationRef             = useRef([]); // full history for multi-turn

  // ── Load Jupiter context on mount ──
  useEffect(() => {
    async function loadContext() {
      try {
        const [snap, kelly, risk] = await Promise.all([
          window.jupiter.invoke("portfolio:getValuation").catch(() => null),
          window.jupiter.invoke("decisions:getKellyRecommendations").catch(() => null),
          window.jupiter.invoke("risk:getSummary").catch(() => null),
        ]);
        setData({ snap, kelly, risk });
      } catch (e) {
        console.warn("[JupiterAI] context load failed:", e);
        setData({});
      } finally {
        setDataLoading(false);
      }
    }
    loadContext();
  }, []);

  // ── Scroll to bottom on new message ──
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // ── Derived context ──
  const regime = useMemo(() =>
    data?.risk?.regime || data?.snap?.regime || "NEUTRAL" || "NEUTRAL",
  [data]);

  const positions = useMemo(() => {
    const raw = data?.snap?.positions || [];
    return raw.filter(p => p.symbol);
  }, [data]);

  const portfolioValue = useMemo(() =>
    data?.snap?.totals?.liveValue || positions.reduce((s, p) => s + Number(p.liveValue || 0), 0),
  [positions]);

  const yearsLeft = Math.max(0.1, GOAL_YEAR - new Date().getFullYear());
  const requiredCAGR = portfolioValue
    ? ((Math.pow(GOAL / portfolioValue, 1 / yearsLeft) - 1) * 100).toFixed(1)
    : "—";

  // ── Send message ──
  const send = useCallback(async (text) => {
    const q = (text || input).trim();
    if (!q || loading) return;
    setInput("");

    const userMsg = { role: "user", content: q };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    // Build conversation history
    const history = [...conversationRef.current, { role: "user", content: q }];

    try {
      const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
      if (!apiKey) throw new Error("VITE_ANTHROPIC_API_KEY not set in .env");

      const systemPrompt = buildSystemPrompt({
        positions,
        portfolioValue,
        kelly: data?.kelly,
        risk: data?.risk,
        regime,
        snap: data?.snap,
      });

      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
          model: "claude-opus-4-6",
          max_tokens: 1024,
          system: systemPrompt,
          messages: history,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error?.message || `API error ${res.status}`);
      }

      const json    = await res.json();
      const content = json.content?.[0]?.text || "No response.";

      // Strip trailing "[Not financial advice]" from display content
      // (we render it as a styled badge instead)
      const displayContent = content.replace(/\[Not financial advice\]\s*$/i, "").trim();
      const hasDisclaimer  = content.toLowerCase().includes("not financial advice");

      const assistantMsg = {
        role: "assistant",
        content: hasDisclaimer ? displayContent + "\n\n[Not financial advice]" : displayContent,
      };

      setMessages(prev => [...prev, assistantMsg]);

      // Update conversation history for multi-turn
      conversationRef.current = [
        ...history,
        { role: "assistant", content: content },
      ];

      // Keep history bounded to last 20 turns to avoid token overflow
      if (conversationRef.current.length > 40) {
        conversationRef.current = conversationRef.current.slice(-40);
      }

    } catch (e) {
      setMessages(prev => [...prev, {
        role: "error",
        content: `Error: ${e.message}`,
      }]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [input, loading, positions, portfolioValue, data, regime]);

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const clearChat = () => {
    setMessages([]);
    conversationRef.current = [];
    inputRef.current?.focus();
  };

  // ─── RENDER ─────────────────────────────────────────────────────────────────
  return (
    <div style={{
      height: "100vh",
      background: BG,
      display: "flex",
      flexDirection: "column",
      ...MONO,
    }}>
      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50%       { opacity: 1;   transform: scale(1.1); }
        }
        @keyframes shimmer {
          0%   { border-color: #1a2133; }
          50%  { border-color: #4da6ff44; }
          100% { border-color: #1a2133; }
        }
        textarea:focus { outline: none; }
        textarea::placeholder { color: #4a5568; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #1a2133; border-radius: 2px; }
      `}</style>

      {/* ── HEADER ── */}
      <div style={{
        padding: "16px 24px",
        borderBottom: `1px solid ${BORDER}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexShrink: 0,
        background: `${SURFACE}cc`,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 8,
            background: `linear-gradient(135deg, ${BLUE}22, ${GREEN}22)`,
            border: `1px solid ${BLUE}55`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 10, color: BLUE, letterSpacing: "0.05em",
          }}>AI</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: TEXT, letterSpacing: "0.06em" }}>
              JUPITER AI
            </div>
            <div style={{ fontSize: 10, color: MUTED, letterSpacing: "0.04em" }}>
              ADAPTIVE DECISION INTELLIGENCE · LIVE PORTFOLIO CONTEXT
            </div>
          </div>
        </div>

        {/* Context badges */}
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {!dataLoading && (
            <>
              <ContextBadge
                label="Portfolio"
                value={portfolioValue ? fmtUSD(portfolioValue) : "—"}
                color={BLUE}
              />
              <ContextBadge
                label="Req. CAGR"
                value={requiredCAGR !== "—" ? requiredCAGR + "%" : "—"}
                color={parseFloat(requiredCAGR) > 30 ? RED : GREEN}
              />
              <ContextBadge
                label="Regime"
                value={regime}
                color={
                  regime === "RISK_ON" || regime === "MILD_RISK_ON" ? GREEN :
                  regime === "RISK_OFF" || regime === "MILD_RISK_OFF" ? RED : AMBER
                }
              />
              <ContextBadge
                label="Kelly ×"
                value={`${KELLY_MULT_TABLE[regime] ?? 0.25}×`}
                color={MUTED}
              />
            </>
          )}
          {messages.length > 0 && (
            <button onClick={clearChat} style={{
              background: "transparent",
              border: `1px solid ${BORDER2}`,
              borderRadius: 6,
              color: MUTED,
              padding: "6px 10px",
              cursor: "pointer",
              fontSize: 10,
              ...MONO,
              letterSpacing: "0.05em",
            }}>CLEAR</button>
          )}
        </div>
      </div>

      {/* ── CHAT AREA ── */}
      <div style={{
        flex: 1,
        overflowY: "auto",
        padding: "24px 32px",
      }}>

        {/* Empty state */}
        {messages.length === 0 && !loading && (
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center",
            justifyContent: "center", height: "100%", gap: 32,
            animation: "fadeSlideIn 0.4s ease",
          }}>
            <div style={{ textAlign: "center" }}>
              <div style={{
                fontSize: 11, color: MUTED, letterSpacing: "0.12em",
                textTransform: "uppercase", marginBottom: 8,
              }}>
                {dataLoading ? "Loading portfolio context..." : `${positions.length} holdings loaded · ${regime} regime`}
              </div>
              <div style={{ fontSize: 22, color: TEXT, fontWeight: 700, letterSpacing: "0.04em", marginBottom: 6 }}>
                Ask Jupiter anything.
              </div>
              <div style={{ fontSize: 12, color: MUTED, maxWidth: 420, lineHeight: 1.6 }}>
                Portfolio decisions, market concepts, position sizing,<br />
                goal tracking — all grounded in your live data.
              </div>
            </div>

            {/* Suggestion chips */}
            <div style={{
              display: "flex", flexWrap: "wrap", gap: 8,
              justifyContent: "center", maxWidth: 640,
            }}>
              {SUGGESTIONS.map((s, i) => (
                <button
                  key={i}
                  onClick={() => send(s)}
                  disabled={dataLoading}
                  style={{
                    background: "transparent",
                    border: `1px solid ${BORDER2}`,
                    borderRadius: 20,
                    color: TEXTDIM,
                    padding: "7px 14px",
                    cursor: dataLoading ? "default" : "pointer",
                    fontSize: 11,
                    ...MONO,
                    transition: "all 0.15s ease",
                    letterSpacing: "0.02em",
                  }}
                  onMouseEnter={e => {
                    e.target.style.borderColor = BLUE + "66";
                    e.target.style.color = TEXT;
                    e.target.style.background = BLUE + "0d";
                  }}
                  onMouseLeave={e => {
                    e.target.style.borderColor = BORDER2;
                    e.target.style.color = TEXTDIM;
                    e.target.style.background = "transparent";
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        {messages.map((m, i) => <Bubble key={i} msg={m} />)}
        {loading && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      {/* ── DISCLAIMER BANNER ── */}
      <div style={{
        padding: "7px 24px",
        background: `${AMBER}08`,
        borderTop: `1px solid ${AMBER}22`,
        borderBottom: `1px solid ${BORDER}`,
        display: "flex", alignItems: "center", gap: 8,
        flexShrink: 0,
      }}>
        <span style={{ fontSize: 10, color: AMBER, letterSpacing: "0.06em" }}>⚠</span>
        <span style={{ fontSize: 10, color: AMBER + "cc", letterSpacing: "0.04em" }}>
          NOT FINANCIAL ADVICE — Jupiter AI is a decision support tool. Always consult a licensed financial advisor before making investment decisions.
        </span>
      </div>

      {/* ── INPUT AREA ── */}
      <div style={{
        padding: "16px 24px 20px",
        borderTop: `1px solid ${BORDER}`,
        background: `${SURFACE}cc`,
        flexShrink: 0,
      }}>
        <div style={{
          display: "flex", gap: 10, alignItems: "flex-end",
          border: `1px solid ${BORDER2}`,
          borderRadius: 10,
          padding: "4px 4px 4px 14px",
          background: BG,
          transition: "border-color 0.2s ease",
        }}
          onFocusCapture={e => e.currentTarget.style.borderColor = BLUE + "66"}
          onBlurCapture={e => e.currentTarget.style.borderColor = BORDER2}
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Ask about your portfolio, a position, market conditions, or any finance concept..."
            disabled={loading || dataLoading}
            rows={1}
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              color: TEXT,
              resize: "none",
              ...MONO,
              fontSize: 12.5,
              lineHeight: 1.6,
              padding: "8px 0",
              minHeight: 36,
              maxHeight: 120,
              overflowY: "auto",
            }}
            onInput={e => {
              e.target.style.height = "auto";
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
            }}
          />
          <button
            onClick={() => send()}
            disabled={loading || dataLoading || !input.trim()}
            style={{
              width: 36, height: 36,
              borderRadius: 7,
              background: loading || !input.trim()
                ? BORDER
                : `linear-gradient(135deg, ${BLUE}, ${BLUE}bb)`,
              border: "none",
              cursor: loading || !input.trim() ? "default" : "pointer",
              color: loading || !input.trim() ? MUTED : "#fff",
              fontSize: 14,
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.15s ease",
              flexShrink: 0,
            }}
          >↑</button>
        </div>
        <div style={{
          marginTop: 7, fontSize: 10, color: MUTED,
          letterSpacing: "0.04em", textAlign: "center",
        }}>
          Enter to send · Shift+Enter for newline · Multi-turn conversation supported
        </div>
      </div>
    </div>
  );
}
