import React, { useState } from "react";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { app } from "../firebase";

const C = {
  bg:     "#060910",
  surface:"#0c1220",
  border: "#1a2540",
  green:  "#22c55e",
  red:    "#ef4444",
  blue:   "#3b82f6",
  muted:  "#6b7280",
  text:   "#e2e8f0",
  sub:    "#94a3b8",
  mono:   "'IBM Plex Mono', monospace",
};

// Handle null app gracefully
const auth = app ? getAuth(app) : null;
const provider = app ? new GoogleAuthProvider() : null;

export default function Login() {
  const [mode,     setMode]     = useState("signin");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  // If Firebase is disabled, show message
  if (!auth) {
    return (
      <div style={{ background: C.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: C.text, fontFamily: C.mono }}>
        <div style={{ textAlign: "center" }}>
          <h1 style={{ fontSize: "24px", marginBottom: "20px" }}>Jupiter</h1>
          <p style={{ color: C.sub }}>Firebase authentication is currently disabled.</p>
          <p style={{ color: C.muted, marginTop: "10px", fontSize: "12px" }}>Please check back soon.</p>
        </div>
      </div>
    );
  }

  async function handleSignIn() {
    if (!email || !password) {
      setError("Email and password required");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setLoading(true);
    setError("");
    try {
      await signInWithPopup(auth, provider);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ background: C.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", fontFamily: C.mono }}>
      <div style={{ maxWidth: "400px", width: "100%" }}>
        <h1 style={{ color: C.text, fontSize: "28px", marginBottom: "30px", textAlign: "center" }}>Jupiter</h1>
        
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "10px", padding: "30px" }}>
          <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
            <button onClick={() => setMode("signin")} style={{ flex: 1, padding: "10px", background: mode === "signin" ? C.blue : C.border, color: C.text, border: "none", borderRadius: "6px", cursor: "pointer", fontFamily: C.mono }}>Sign In</button>
            <button onClick={() => setMode("signup")} style={{ flex: 1, padding: "10px", background: mode === "signup" ? C.blue : C.border, color: C.text, border: "none", borderRadius: "6px", cursor: "pointer", fontFamily: C.mono }}>Sign Up</button>
          </div>

          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: "100%", padding: "10px", marginBottom: "10px", background: C.bg, border: `1px solid ${C.border}`, color: C.text, borderRadius: "6px", fontFamily: C.mono }} />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: "100%", padding: "10px", marginBottom: "15px", background: C.bg, border: `1px solid ${C.border}`, color: C.text, borderRadius: "6px", fontFamily: C.mono }} />

          {error && <div style={{ color: C.red, fontSize: "12px", marginBottom: "15px" }}>{error}</div>}

          <button onClick={handleSignIn} disabled={loading} style={{ width: "100%", padding: "10px", background: C.blue, color: C.text, border: "none", borderRadius: "6px", cursor: loading ? "default" : "pointer", opacity: loading ? 0.7 : 1, fontFamily: C.mono, fontWeight: "700", marginBottom: "10px" }}>
            {loading ? "Loading..." : (mode === "signin" ? "Sign In" : "Sign Up")}
          </button>

          <button onClick={handleGoogleSignIn} disabled={loading} style={{ width: "100%", padding: "10px", background: C.border, color: C.text, border: "none", borderRadius: "6px", cursor: loading ? "default" : "pointer", fontFamily: C.mono, fontSize: "12px" }}>
            Google Sign In
          </button>
        </div>

        <p style={{ color: C.muted, fontSize: "12px", textAlign: "center", marginTop: "20px" }}>Private beta. Invite only.</p>
      </div>
    </div>
  );
}
