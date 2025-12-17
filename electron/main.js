const { app, BrowserWindow } = require("electron");
const path = require("path");
const { registerPortfolioIpc } = require("./ipc/portfolioIpc");

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, "..", "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  win.loadURL("http://localhost:5173");
}

app.whenReady().then(() => {
  registerPortfolioIpc();
  createWindow();
});

