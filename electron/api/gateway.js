// Jupiter API Gateway (Backend Layer)
const { ipcMain } = require("electron");

// Simple test endpoint
ipcMain.handle("api:pulse", async () => {
  return {
    status: "OK",
    timestamp: new Date().toISOString(),
    message: "Jupiter backend is alive."
  };
});

