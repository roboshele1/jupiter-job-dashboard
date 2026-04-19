// renderer/pages/JupiterAI.jsx
// JUPITER AI — Adaptive Decision Intelligence Layer v2
// Powered by Claude. Grounded in live Jupiter data + persistent memory.
// NOT financial advice.

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";

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

function fmtUSD(n) {
  if (!n && n !== 0) return "—";
  return "$" + Number(n).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function getCAGR(symbol, regime = "NEUTRAL") {
  const base = BASE_CAGR[symbol?.toUpperCase()] ?? BASE_CAGR.default;
  const mod  = REGIME_MODIFIER[regime] ?? 0;
  return Math.max(5, base + mod);
}

function formatMemoryBlock(memory) {
  if (!memory || memory.totalDecisions === 0) return null;
  const lines = [];
  lines.push(`JUPITER DECISION MEMORY (${memory.totalDecisions} events logged):`);
  if (memory.portfolioGrowth && memory.firstSeen) {
    const since = new Date(memory.firstSeen).toLocaleDateString("en-US", { month: "short", year: "numeric" });
    lines.push(`  - Portfolio growth since ${since}: ${memory.portfolioGrowth}`);
  }
  if (memory.executionCount > 0) lines.push(`  - Total LCPE executions: ${memory.executionCount}`);
  if (memory.topExecuted?.length > 0) lines.push(`  - Most frequently bought: ${memory.topExecuted.join(", ")}`);
  if (memory.lastRegimeShift) lines.push(`  - Last regime shift: ${memory.lastRegimeShift}`);
  if (memory.aiInteractions > 0) lines.push(`  - Prior AI interactions: ${memory.aiInteractions}`);
  if (memory.recentQuestions?.length > 0) {
    lines.push(`  - Recent questions: ${memory.recentQuestions.slice(-3).map(q => `"${q}"`).join(", ")}`);
  }
  lines.push(`  USE THIS: Weave memory in naturally when relevant. Do not recite all facts.`);
  return lines.join("\n");
}

function buildSystemPrompt({ positions, portfolioValue, risk, regime, memory }) {
  const yearsLeft    = Math.max(0.1, GOAL_YEAR - new Date().getFullYear());
  const requiredCAGR = portfolioValue
    ? ((Math.pow(GOAL / portfolioValue, 1 / yearsLeft) - 1) * 100).toFixed(1)
    : "unknown";
  const regimeMod = REGIME_MODIFIER[regime] ?? 0;

  const holdingLines = (positions || []).map(p => {
    const cagr   = getCAGR(p.symbol, regime);
    const weight = portfolioValue ? ((p.liveValue / portfolioValue) * 100).toFixed(1) : "?";
    const pnl    = p.liveValue && p.costBasis
      ? (((p.liveValue - p.costBasis) / p.costBasis) * 100).toFixed(1) : "?";
    return `  - ${p.symbol}: value=${fmtUSD(p.liveValue)}, weight=${weight}%, CAGR=${cagr}%, P&L=${pnl}%`;
  }).join("\n");

  const riskSummary = risk
    ? `  - VIX: ${risk.vix ?? "?"}\n  - Regime: ${regime}\n  - CAGR modifier: ${regimeMod >= 0 ? "+" : ""}${regimeMod}%`
    : "  - Risk data unavailable";

  const memoryBlock = formatMemoryBlock(memory);

  return `You are JUPITER AI — the embedded decision intelligence engine inside Jupiter, targeting $1,000,000 by ${GOAL_YEAR}.

You are NOT a generic chatbot. You have live portfolio data, market regime, and full decision history. Answer everything grounded in this data first.

SCOPE: Full-spectrum financial intelligence — portfolio decisions, macro, Fed policy, sector analysis, crypto, earnings, derivatives, ETFs, global markets, any investment concept. You answer everything.

ADAPTATION:
- Basic/educational: plain English, be a brilliant teacher
- Portfolio-specific: lead with live data, then institutional reasoning
- Macro: answer the macro, connect to holdings if relevant
- Match sophistication level always

LIVE PORTFOLIO:
  - Value: ${fmtUSD(portfolioValue)} | Goal: $1,000,000 by ${GOAL_YEAR}
  - Years left: ${yearsLeft.toFixed(1)} | Required CAGR: ${requiredCAGR}%
  - Regime: ${regime}

HOLDINGS:
${holdingLines || "  - No holdings data available"}

MARKET & RISK:
${riskSummary}
${memoryBlock ? `\n${memoryBlock}\n` : ""}
FORMAT: Direct, precise, no filler. Portfolio verdicts: BUY/HOLD/TRIM/MONITOR. Prose paragraphs, max 5 bullets. No ## headers or **bold**. Under 300 words unless needed. End portfolio recommendations with one concrete next action.

GUARDRAIL: Every portfolio recommendation must end with: "[Not financial advice]"

TONE: Institutional precision. Zero bias. Zero favoritism. Data and memory rule.`;
}

function Bubble({ msg }) {
  const isUser = msg.role === "user";
  const isErr  = msg.role === "error";
  return (
    <div style={{ display:"flex", justifyContent: isUser ? "flex-end" : "flex-start", marginBottom:16, animation:"fadeSlideIn 0.25s ease" }}>
      {!isUser && (
        <div style={{ width:28, height:28, borderRadius:"50%", background:`linear-gradient(135deg,${BLUE}33,${GREEN}33)`, border:`1px solid ${BLUE}55`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, marginRight:10, marginTop:2, ...MONO, fontSize:9, color:BLUE }}>AI</div>
      )}
      <div style={{ maxWidth:"72%", padding:"12px 16px", borderRadius: isUser ? "12px 12px 2px 12px" : "2px 12px 12px 12px", background: isUser ? `linear-gradient(135deg,${BLUE}22,${BLUE}11)` : isErr ? `${RED}11` : SURFACE, border:`1px solid ${isUser ? BLUE+"44" : isErr ? RED+"44" : BORDER}`, ...MONO, fontSize:12.5, lineHeight:1.7, color: isErr ? RED : TEXT, whiteSpace:"pre-wrap", wordBreak:"break-word" }}>
        {msg.content}
        {msg.role === "assistant" && msg.content.includes("[Not financial advice]") && (
          <div style={{ marginTop:10, paddingTop:8, borderTop:`1px solid ${BORDER}`, fontSize:10, color:AMBER, letterSpacing:"0.05em" }}>⚠ NOT FINANCIAL ADVICE — FOR DECISION SUPPORT ONLY</div>
        )}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div style={{ display:"flex", alignItems:"flex-start", marginBottom:16 }}>
      <div style={{ width:28, height:28, borderRadius:"50%", background:`linear-gradient(135deg,${BLUE}33,${GREEN}33)`, border:`1px solid ${BLUE}55`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, marginRight:10, ...MONO, fontSize:9, color:BLUE }}>AI</div>
      <div style={{ padding:"14px 18px", borderRadius:"2px 12px 12px 12px", background:SURFACE, border:`1px solid ${BORDER}`, display:"flex", gap:5, alignItems:"center" }}>
        {[0,1,2].map(i => <div key={i} style={{ width:6, height:6, borderRadius:"50%", background:BLUE, animation:`pulse 1.2s ease-in-out ${i*0.2}s infinite` }} />)}
      </div>
    </div>
  );
}

function ContextBadge({ label, value, color=BLUE }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:2, padding:"8px 12px", borderRadius:6, background:`${color}0d`, border:`1px solid ${color}33`, minWidth:90 }}>
      <span style={{ ...MONO, fontSize:9, color:MUTED, letterSpacing:"0.08em", textTransform:"uppercase" }}>{label}</span>
      <span style={{ ...MONO, fontSize:12, color, fontWeight:700 }}>{value}</span>
    </div>
  );
}

function MemoryBadge({ memory }) {
  if (!memory || memory.totalDecisions === 0) return null;
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:2, padding:"8px 12px", borderRadius:6, background:`${GREEN}0d`, border:`1px solid ${GREEN}33`, minWidth:90 }}>
      <span style={{ ...MONO, fontSize:9, color:MUTED, letterSpacing:"0.08em", textTransform:"uppercase" }}>Memory</span>
      <span style={{ ...MONO, fontSize:12, color:GREEN, fontWeight:700 }}>{memory.totalDecisions} events</span>
    </div>
  );
}

export default function JupiterAI() {
  const [messages, setMessages]       = useState([]);
  const [input, setInput]             = useState("");
  const [loading, setLoading]         = useState(false);
  const [data, setData]               = useState(null);
  const [memory, setMemory]           = useState(null);
  const [dataLoading, setDataLoading] = useState(true);
  const bottomRef                     = useRef(null);
  const inputRef                      = useRef(null);
  const conversationRef               = useRef([]);
  const conversationLoaded            = useRef(false);

  useEffect(() => {
    async function loadContext() {
      try {
        const [snap, risk, memorySummary] = await Promise.all([
          window.jupiter.invoke("portfolio:getValuation").catch(() => null),
          window.jupiter.invoke("riskCentre:intelligence:v2").catch(() => null),
          window.jupiter.invoke("memory:getSummary").catch(() => null),
        ]);
        setData({ snap, risk });
        setMemory(memorySummary);
      } catch (e) {
        console.warn("[JupiterAI] context load failed:", e);
        setData({});
      } finally {
        setDataLoading(false);
      }
    }
    loadContext();
  }, []);

  useEffect(() => {
    if (!data || dataLoading || messages.length > 0) return;

    async function runProactiveAlert() {
      const freshPositions = (data?.snap?.positions || []).filter(p => p.symbol);
      const freshPortfolioValue = data?.snap?.totals?.liveValue || freshPositions.reduce((s,p) => s + Number(p.liveValue||0), 0);
      const freshRegime = data?.risk?.regime || data?.snap?.regime || "NEUTRAL";
      const yearsLeft = Math.max(0.1, GOAL_YEAR - new Date().getFullYear());
      const reqCAGR = freshPortfolioValue ? ((Math.pow(GOAL/freshPortfolioValue, 1/yearsLeft)-1)*100) : null;

      const alerts = [];

      if (reqCAGR && reqCAGR > 35) alerts.push(`CAGR required is ${reqCAGR.toFixed(1)}% — significantly above historical equity returns. Portfolio needs urgent attention.`);
      else if (reqCAGR && reqCAGR > 28) alerts.push(`Required CAGR of ${reqCAGR.toFixed(1)}% is aggressive. You are behind pace for the $1M goal.`);

      if (freshRegime === "RISK_OFF") alerts.push("Market regime has shifted to RISK_OFF. Consider reducing exposure to high-beta positions.");
      else if (freshRegime === "MILD_RISK_OFF") alerts.push("Regime is MILD_RISK_OFF. Defensive posture recommended for new capital.");

      const overweight = freshPositions.filter(p => freshPortfolioValue && (p.liveValue/freshPortfolioValue)*100 > 20);
      if (overweight.length > 0) alerts.push(`${overweight.map(p => p.symbol).join(", ")} ${overweight.length===1?"is":"are"} over 20% of portfolio — concentration risk detected.`);

      const losers = freshPositions.filter(p => p.costBasis && p.liveValue && ((p.liveValue - p.costBasis)/p.costBasis)*100 < -15);
      if (losers.length > 0) alerts.push(`${losers.map(p => p.symbol).join(", ")} ${losers.length===1?"is":"are"} down over 15% from cost basis.`);

      if (alerts.length === 0) return;

      const proactivePrompt = "You are JUPITER AI. Based on live portfolio data, generate a short proactive briefing (under 150 words). Do not greet. Go straight to the intelligence. Cover only what matters right now. Conditions detected:\n" + alerts.map(a => "- " + a).join("\n") + "\n\nBe direct. End with one concrete action suggestion. No headers. No bold. [Not financial advice]";

      setLoading(true);
      try {
        const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
        if (!apiKey) return;
        const res = await fetch("https://api.anthropic.com/v1/messages", {
          method:"POST",
          headers:{
            "Content-Type":"application/json",
            "x-api-key":apiKey,
            "anthropic-version":"2023-06-01",
            "anthropic-dangerous-direct-browser-access":"true",
          },
          body: JSON.stringify({
            model:"claude-sonnet-4-6",
            max_tokens:300,
            messages:[{ role:"user", content:proactivePrompt }],
          }),
        });
        if (!res.ok) return;
        const json = await res.json();
        const content = json.content?.[0]?.text || "";
        if (content) {
          setMessages([{ role:"assistant", content: content.trim() + "\n\n[Not financial advice]" }]);
          conversationRef.current = [{ role:"assistant", content }];
        }
      } catch(e) {
        console.warn("[JupiterAI] proactive alert failed:", e);
      } finally {
        setLoading(false);
      }
    }

    runProactiveAlert();
  }, [data, dataLoading]);

  useEffect(() => {
    if (conversationLoaded.current) return;
    conversationLoaded.current = true;
    window.jupiter.invoke("conversation:load").then(saved => {
      if (Array.isArray(saved) && saved.length > 0) {
        conversationRef.current = saved;
        setMessages(saved);
      }
    }).catch(() => {});
  }, []);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:"smooth" }); }, [messages, loading]);

  const regime = useMemo(() => data?.risk?.regime || data?.snap?.regime || "NEUTRAL", [data]);
  const positions = useMemo(() => (data?.snap?.positions || []).filter(p => p.symbol), [data]);
  const portfolioValue = useMemo(() =>
    data?.snap?.totals?.liveValue || positions.reduce((s,p) => s + Number(p.liveValue||0), 0),
  [data, positions]);

  const yearsLeft = Math.max(0.1, GOAL_YEAR - new Date().getFullYear());
  const requiredCAGR = portfolioValue
    ? ((Math.pow(GOAL/portfolioValue, 1/yearsLeft)-1)*100).toFixed(1) : "—";

  const send = useCallback(async (text) => {
    const q = (text || input).trim();
    if (!q || loading) return;
    setInput("");
    setMessages(prev => [...prev, { role:"user", content:q }]);
    setLoading(true);

    const history = [...conversationRef.current, { role:"user", content:q }];

    try {
      const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
      if (!apiKey) throw new Error("VITE_ANTHROPIC_API_KEY not set in .env — add your Anthropic API key to activate Jupiter AI");

      const [freshSnap, freshRisk, freshMemory] = await Promise.all([
        window.jupiter.invoke("portfolio:getValuation").catch(() => null),
        window.jupiter.invoke("riskCentre:intelligence:v2").catch(() => null),
        window.jupiter.invoke("memory:getSummary").catch(() => memory),
      ]);

      const freshPositions = (freshSnap?.positions || []).filter(p => p.symbol);
      const freshPortfolioValue = freshSnap?.totals?.liveValue || freshPositions.reduce((s,p) => s + Number(p.liveValue||0), 0);
      const freshRegime = freshRisk?.regime || freshSnap?.regime || "NEUTRAL";

      const systemPrompt = buildSystemPrompt({
        positions:freshPositions, portfolioValue:freshPortfolioValue, risk:freshRisk, regime:freshRegime, memory:freshMemory,
      });

      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST",
        headers:{
          "Content-Type":"application/json",
          "x-api-key":apiKey,
          "anthropic-version":"2023-06-01",
          "anthropic-dangerous-direct-browser-access":"true",
        },
        body: JSON.stringify({
          model:"claude-opus-4-6",
          max_tokens:1024,
          stream:true,
          system:systemPrompt,
          messages:history,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(()=>({}));
        throw new Error(err?.error?.message || `API error ${res.status}`);
      }

      let content = "";
      const streamId = Date.now();
      setMessages(prev => [...prev, { role:"assistant", content:"", id:streamId }]);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream:true });
        const lines = buffer.split("\n");
        buffer = lines.pop();
        for (const line of lines) {
          if (!line.startsWith("data:")) continue;
          const data = line.slice(5).trim();
          if (data === "[DONE]") continue;
          try {
            const parsed = JSON.parse(data);
            if (parsed.type === "content_block_delta" && parsed.delta?.type === "text_delta") {
              content += parsed.delta.text;
              setMessages(prev => prev.map(m => m.id === streamId ? { ...m, content } : m));
            }
          } catch(e) {}
        }
      }

      const displayContent = content.replace(/\[Not financial advice\]\s*$/i,"").trim();
      const hasDisclaimer  = content.toLowerCase().includes("not financial advice");
      const finalContent   = hasDisclaimer ? displayContent+"\n\n[Not financial advice]" : displayContent;

      setMessages(prev => prev.map(m => m.id === streamId ? { ...m, content:finalContent } : m));
      conversationRef.current = [...history, { role:"assistant", content }];
      if (conversationRef.current.length > 40) conversationRef.current = conversationRef.current.slice(-40);
      window.jupiter.invoke("conversation:save", conversationRef.current).catch(() => {});

      try {
        await window.jupiter.invoke("memory:recordAIInteraction", {
          question:q, responseLength:content.length, regime, portfolioValue, holdings:positions.length,
        });
        const updated = await window.jupiter.invoke("memory:getSummary").catch(()=>null);
        if (updated) setMemory(updated);
      } catch(e) { /* non-fatal */ }

    } catch(e) {
      setMessages(prev => [...prev, { role:"error", content:`Error: ${e.message}` }]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [input, loading, positions, portfolioValue, data, regime, memory]);

  const handleKey = (e) => { if (e.key==="Enter" && !e.shiftKey) { e.preventDefault(); send(); } };
  const clearChat = () => { setMessages([]); conversationRef.current=[]; window.jupiter.invoke("conversation:clear").catch(()=>{}); inputRef.current?.focus(); };

  return (
    <div style={{ height:"100vh", background:BG, display:"flex", flexDirection:"column", ...MONO }}>
      <style>{`
        @keyframes fadeSlideIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse { 0%,100%{opacity:0.3;transform:scale(0.8)} 50%{opacity:1;transform:scale(1.1)} }
        textarea:focus{outline:none} textarea::placeholder{color:#4a5568}
        ::-webkit-scrollbar{width:4px} ::-webkit-scrollbar-track{background:transparent} ::-webkit-scrollbar-thumb{background:#1a2133;border-radius:2px}
      `}</style>

      {/* HEADER */}
      <div style={{ padding:"16px 24px", borderBottom:`1px solid ${BORDER}`, display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0, background:`${SURFACE}cc` }}>
        <div style={{ display:"flex", alignItems:"center", gap:14 }}>
          <div style={{ width:36, height:36, borderRadius:8, background:`linear-gradient(135deg,${BLUE}22,${GREEN}22)`, border:`1px solid ${BLUE}55`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, color:BLUE, letterSpacing:"0.05em" }}>AI</div>
          <div>
            <div style={{ fontSize:14, fontWeight:700, color:TEXT, letterSpacing:"0.06em" }}>JUPITER AI</div>
            <div style={{ fontSize:10, color:MUTED, letterSpacing:"0.04em" }}>ADAPTIVE DECISION INTELLIGENCE · LIVE CONTEXT · MEMORY</div>
          </div>
        </div>
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          {!dataLoading && (
            <>
              <ContextBadge label="Portfolio" value={portfolioValue ? fmtUSD(portfolioValue) : "—"} color={BLUE} />
              <ContextBadge label="Req. CAGR" value={requiredCAGR!=="—" ? requiredCAGR+"%" : "—"} color={parseFloat(requiredCAGR)>30 ? RED : GREEN} />
              <ContextBadge label="Regime" value={regime} color={regime==="RISK_ON"||regime==="MILD_RISK_ON" ? GREEN : regime==="RISK_OFF"||regime==="MILD_RISK_OFF" ? RED : AMBER} />
              <MemoryBadge memory={memory} />
            </>
          )}
          {messages.length>0 && (
            <button onClick={clearChat} style={{ background:"transparent", border:`1px solid ${BORDER2}`, borderRadius:6, color:MUTED, padding:"6px 10px", cursor:"pointer", fontSize:10, ...MONO, letterSpacing:"0.05em" }}>CLEAR</button>
          )}
        </div>
      </div>

      {/* CHAT AREA */}
      <div style={{ flex:1, overflowY:"auto", padding:"24px 32px" }}>
        {messages.length===0 && !loading && (
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"100%", gap:32, animation:"fadeSlideIn 0.4s ease" }}>
            <div style={{ textAlign:"center" }}>
              <div style={{ fontSize:11, color:MUTED, letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:8 }}>
                {dataLoading ? "Loading portfolio context..." : `${positions.length} holdings · ${regime} regime${memory?.totalDecisions>0 ? ` · ${memory.totalDecisions} memory events` : ""}`}
              </div>
              <div style={{ fontSize:22, color:TEXT, fontWeight:700, letterSpacing:"0.04em", marginBottom:6 }}>Ask Jupiter anything.</div>
              <div style={{ fontSize:12, color:MUTED, maxWidth:460, lineHeight:1.6 }}>
                Portfolio decisions, macro markets, investment concepts,<br/>position sizing — grounded in your live data and history.
              </div>
            </div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:8, justifyContent:"center", maxWidth:640 }}>
              {SUGGESTIONS.map((s,i) => (
                <button key={i} onClick={()=>send(s)} disabled={dataLoading} style={{ background:"transparent", border:`1px solid ${BORDER2}`, borderRadius:20, color:TEXTDIM, padding:"7px 14px", cursor:dataLoading?"default":"pointer", fontSize:11, ...MONO, transition:"all 0.15s ease", letterSpacing:"0.02em" }}
                  onMouseEnter={e=>{e.target.style.borderColor=BLUE+"66";e.target.style.color=TEXT;e.target.style.background=BLUE+"0d"}}
                  onMouseLeave={e=>{e.target.style.borderColor=BORDER2;e.target.style.color=TEXTDIM;e.target.style.background="transparent"}}
                >{s}</button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m,i) => <Bubble key={i} msg={m} />)}
        {loading && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      {/* DISCLAIMER */}
      <div style={{ padding:"7px 24px", background:`${AMBER}08`, borderTop:`1px solid ${AMBER}22`, borderBottom:`1px solid ${BORDER}`, display:"flex", alignItems:"center", gap:8, flexShrink:0 }}>
        <span style={{ fontSize:10, color:AMBER, letterSpacing:"0.06em" }}>⚠</span>
        <span style={{ fontSize:10, color:AMBER+"cc", letterSpacing:"0.04em" }}>NOT FINANCIAL ADVICE — Jupiter AI is a decision support tool. Always consult a licensed financial advisor before making investment decisions.</span>
      </div>

      {/* INPUT */}
      <div style={{ padding:"16px 24px 20px", borderTop:`1px solid ${BORDER}`, background:`${SURFACE}cc`, flexShrink:0 }}>
        <div style={{ display:"flex", gap:10, alignItems:"flex-end", border:`1px solid ${BORDER2}`, borderRadius:10, padding:"4px 4px 4px 14px", background:BG, transition:"border-color 0.2s ease" }}
          onFocusCapture={e=>e.currentTarget.style.borderColor=BLUE+"66"}
          onBlurCapture={e=>e.currentTarget.style.borderColor=BORDER2}
        >
          <textarea ref={inputRef} value={input} onChange={e=>setInput(e.target.value)} onKeyDown={handleKey}
            placeholder="Ask about your portfolio, markets, macro, or any finance concept..."
            disabled={loading||dataLoading} rows={1}
            style={{ flex:1, background:"transparent", border:"none", color:TEXT, resize:"none", ...MONO, fontSize:12.5, lineHeight:1.6, padding:"8px 0", minHeight:36, maxHeight:120, overflowY:"auto" }}
            onInput={e=>{e.target.style.height="auto";e.target.style.height=Math.min(e.target.scrollHeight,120)+"px"}}
          />
          <button onClick={()=>send()} disabled={loading||dataLoading||!input.trim()} style={{ width:36, height:36, borderRadius:7, background:loading||!input.trim() ? BORDER : `linear-gradient(135deg,${BLUE},${BLUE}bb)`, border:"none", cursor:loading||!input.trim()?"default":"pointer", color:loading||!input.trim()?MUTED:"#fff", fontSize:14, display:"flex", alignItems:"center", justifyContent:"center", transition:"all 0.15s ease", flexShrink:0 }}>↑</button>
        </div>
        <div style={{ marginTop:7, fontSize:10, color:MUTED, letterSpacing:"0.04em", textAlign:"center" }}>Enter to send · Shift+Enter for newline · Multi-turn · Memory-aware</div>
      </div>
    </div>
  );
}
