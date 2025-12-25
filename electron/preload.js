// electron/preload.js
// JUPITER — Preload Bridge (Authoritative)
// Purpose: Safe, minimal IPC exposure for Renderer
// Rule: Renderer NEVER touches fs, engine, or ipc directly

const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("jupiter", {
  /* =========================
     DASHBOARD
     ========================= */
  getDashboardSnapshot: () =>
    ipcRenderer.invoke("dashboard:getSnapshot"),

  /* =========================
     PORTFOLIO
     ========================= */
  getPortfolioSnapshot: () =>
    ipcRenderer.invoke("portfolio:getSnapshot"),

  refreshPortfolio: () =>
    ipcRenderer.invoke("portfolio:refresh"),

  /* =========================
     RISK
     ========================= */
  getRiskSnapshot: () =>
    ipcRenderer.invoke("risk:getSnapshot"),

  /* =========================
     ALERTS
     ========================= */
  getRiskAlerts: () =>
    ipcRenderer.invoke("risk:getAlerts"),
});

