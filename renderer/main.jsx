import React from "react";
import ReactDOM from "react-dom/client";

import "./services/debugBoot"; // DEBUG BOOT (read-only, no side effects)

import App from "./App";
import "./styles/global.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

