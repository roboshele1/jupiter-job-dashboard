const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const fetch = require("node-fetch");

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  win.loadURL("http://localhost:5173");
}

ipcMain.handle("get-market-snapshot", async () => {
  const res = await fetch("http://localhost:3001/snapshot");
  return await res.json();
});

app.whenReady().then(createWindow);

