// main.js
// JUPITER — IPC Snapshot Hydration (LOCKED)

const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, "preload.js")
    }
  });

  mainWindow.loadURL("http://localhost:5173");
}

ipcMain.handle("get-snapshot", async () => {
  const snapshot = require("./renderer/state/snapshotStore").getSnapshot();
  return snapshot;
});

app.whenReady().then(createWindow);

