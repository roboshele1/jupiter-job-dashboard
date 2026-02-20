// renderer/pages/Login.jsx
// JUPITER — Authentication Screen (Firebase Email + Google)

import React, { useState } from "react";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";
import { app } from "../firebase";

const C = {
  bg:     "#060910",
  panel:  "#0d1117",
  border: "#1e2530",
  accent: "#3b82f6",
  red:    "#ef4444",
  muted:  "#6b7280",
  text:   "#e2e8f0",
  sub:    "#94a3b8",
  mono:   "'IBM Plex Mono', monospace",
};

const auth     = getAuth(app);
const provider = new GoogleAuthProvider();

export default function Login() {
  const [mode,     setMode]     = useState("signin"); // signin | signup
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  const inputStyle = {
    background: "#0a0f1a", border: `1px solid ${C.border}`,
    borderRadius: 6, color: C.text, fontFamily: C.mono,
    fontSize: 13, padding: "10px 12px", width: "100%",
    outline: "none", boxSizing: "border-box",
  };

  async function handleEmail() {
    if (!email || !password) { setError("Email and password required."); return; }
    setLoading(true); setError("");
    try {
      if (mode === "signin") {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (e) {
      setError(e.message.replace("Firebase: ", "").replace(/ \(auth\/.*\)/, ""));
    } finally { setLoading(false); }
  }

  async function handleGoogle() {
    setLoading(true); setError("");
    try {
      await signInWithPopup(auth, provider);
    } catch (e) {
      setError(e.message.replace("Firebase: ", "").replace(/ \(auth\/.*\)/, ""));
    } finally { setLoading(false); }
  }

  return (
    <div style={{
      background: C.bg, minHeight: "100vh", display: "flex",
      alignItems: "center", justifyContent: "center", fontFamily: C.mono,
    }}>
      <div style={{
        background: C.panel, border: `1px solid ${C.border}`,
        borderRadius: 14, padding: "40px 36px", width: 380,
      }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 28, fontWeight: 900, color: C.text, letterSpacing: "-0.02em" }}>
            ◈ JUPITER
          </div>
          <div style={{ fontSize: 11, color: C.muted, marginTop: 6, letterSpacing: "0.1em" }}>
            DECISION ENGINE
          </div>
        </div>

        {/* Mode toggle */}
        <div style={{
          display: "flex", background: "#0a0f1a",
          borderRadius: 8, padding: 3, marginBottom: 24,
        }}>
          {["signin", "signup"].map(m => (
            <button key={m} onClick={() => { setMode(m); setError(""); }} style={{
              flex: 1, padding: "7px 0", borderRadius: 6, border: "none",
              fontFamily: C.mono, fontSize: 11, fontWeight: 700, cursor: "pointer",
              background: mode === m ? C.accent : "transparent",
              color: mode === m ? "#fff" : C.muted,
              letterSpacing: "0.06em",
            }}>{m === "signin" ? "SIGN IN" : "CREATE ACCOUNT"}</button>
          ))}
        </div>

        {/* Email/password */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input
            style={inputStyle} type="email" placeholder="Email"
            value={email} onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleEmail()}
          />
          <input
            style={inputStyle} type="password" placeholder="Password"
            value={password} onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleEmail()}
          />
        </div>

        {/* Error */}
        {error && (
          <div style={{
            marginTop: 12, padding: "8px 12px",
            background: C.red + "18", border: `1px solid ${C.red}44`,
            borderRadius: 6, color: C.red, fontSize: 11,
          }}>{error}</div>
        )}

        {/* Email submit */}
        <button
          onClick={handleEmail} disabled={loading}
          style={{
            width: "100%", marginTop: 16, padding: "11px 0",
            background: C.accent, border: "none", borderRadius: 8,
            color: "#fff", fontFamily: C.mono, fontSize: 13,
            fontWeight: 700, cursor: "pointer", opacity: loading ? 0.6 : 1,
          }}
        >{loading ? "…" : mode === "signin" ? "Sign In" : "Create Account"}</button>

        {/* Divider */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "18px 0" }}>
          <div style={{ flex: 1, height: 1, background: C.border }} />
          <span style={{ fontSize: 10, color: C.muted }}>OR</span>
          <div style={{ flex: 1, height: 1, background: C.border }} />
        </div>

        {/* Google */}
        <button
          onClick={handleGoogle} disabled={loading}
          style={{
            width: "100%", padding: "11px 0",
            background: "none", border: `1px solid ${C.border}`,
            borderRadius: 8, color: C.text, fontFamily: C.mono,
            fontSize: 13, cursor: "pointer", display: "flex",
            alignItems: "center", justifyContent: "center", gap: 10,
            opacity: loading ? 0.6 : 1,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 48 48">
            <path fill="#FFC107" d="M43.6 20H24v8h11.3C33.6 32.6 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 2.9l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 19.7-8 19.7-20 0-1.3-.1-2.7-.1-4z"/>
            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 16 19 13 24 13c3 0 5.7 1.1 7.8 2.9l5.7-5.7C34.1 6.5 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
            <path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.9 13.5-5l-6.2-5.2C29.4 35.6 26.8 36 24 36c-5.2 0-9.6-3.3-11.3-8H6.1C9.4 36.2 16.2 44 24 44z"/>
            <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.9 2.6-2.6 4.7-4.8 6.2l6.2 5.2C40.5 36.2 44 30.6 44 24c0-1.3-.1-2.7-.4-4z"/>
          </svg>
          Continue with Google
        </button>

        <div style={{ textAlign: "center", marginTop: 20, fontSize: 10, color: C.muted }}>
          Your data is encrypted and synced securely via Firebase.
        </div>
      </div>
    </div>
  );
}
