import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";

/**
 * JUPITER ROOT ENTRY
 * Phase 2A — Navigation Shell LOCK
 * 
 * This file MUST always mount App as the root shell.
 * No engine, page, or component may bypass this.
 */

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

