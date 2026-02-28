import React, { createContext, useContext, useEffect, useState } from "react";
import { app } from "./firebase";

// If Firebase is disabled (app is null), return stub auth
const auth = app ? (() => {
  try {
    const { getAuth } = require("firebase/auth");
    return getAuth(app);
  } catch (e) {
    return null;
  }
})() : null;

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (!auth) {
      setUser(null);
      return;
    }
    const { onAuthStateChanged } = require("firebase/auth");
    const unsub = onAuthStateChanged(auth, u => setUser(u ?? null));
    return unsub;
  }, []);

  async function signOut() {
    if (!auth) return;
    const { signOut: firebaseSignOut } = require("firebase/auth");
    await firebaseSignOut(auth);
  }

  return (
    <AuthContext.Provider value={{ user, syncing, setSyncing, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
