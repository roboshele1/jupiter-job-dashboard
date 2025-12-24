import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  const devURL = process.env.VITE_DEV_SERVER_URL;

  if (devURL) {
    await mainWindow.loadURL(devURL);
  } else {
    await mainWindow.loadFile(
      path.join(__dirname, '../renderer/index.html')
    );
  }
}

app.whenReady().then(createWindow);

/* ---------------- IPC CONTRACTS ---------------- */

ipcMain.handle('portfolio:getSnapshot', async () => {
  const engine = await import('../engine/portfolio/portfolioEngine.js');
  return engine.getPortfolioSnapshot();
});

ipcMain.handle('market:getLivePrices', async () => {
  const market = await import('../renderer/engine/market/liveSnapshotServer.js');
  return market.getLivePrices();
});

