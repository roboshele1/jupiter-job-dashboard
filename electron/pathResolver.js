'use strict';
const path = require('path');
const fs   = require('fs');

let _app;
try { _app = require('electron').app; } catch (_) {}

function isPackaged() {
  try { return _app && _app.isPackaged; } catch (_) { return false; }
}

function getEngineDataDir() {
  if (isPackaged() && _app.isReady()) {
    return path.join(_app.getPath('userData'), 'engine-data');
  }
  return path.join(__dirname, '..', 'engine', 'data');
}

function getBundledDataDir() {
  if (isPackaged()) {
    return path.join(process.resourcesPath, 'app.asar.unpacked', 'engine', 'data');
  }
  return path.join(__dirname, '..', 'engine', 'data');
}

function initDataDir() {
  if (!isPackaged()) return;
  
  const dest = getEngineDataDir();
  fs.mkdirSync(dest, { recursive: true });
  fs.mkdirSync(path.join(dest, 'users'), { recursive: true });

  const src = getBundledDataDir();
  if (!fs.existsSync(src)) return;

  const srcConfig  = path.join(src, 'userConfig.json');
  const destConfig = path.join(dest, 'userConfig.json');
  if (fs.existsSync(srcConfig) && !fs.existsSync(destConfig)) {
    fs.copyFileSync(srcConfig, destConfig);
  }

  const srcUsers = path.join(src, 'users');
  if (fs.existsSync(srcUsers)) {
    for (const uid of fs.readdirSync(srcUsers)) {
      const srcDir  = path.join(srcUsers, uid);
      const destDir = path.join(dest, 'users', uid);
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
        for (const f of fs.readdirSync(srcDir)) {
          const df = path.join(destDir, f);
          if (!fs.existsSync(df)) fs.copyFileSync(path.join(srcDir, f), df);
        }
      }
    }
  }
}

function getHoldingsFilePath(userId) {
  const dir = path.join(getEngineDataDir(), 'users', userId);
  fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, 'holdings.json');
}

function getUserConfigPath() {
  return path.join(getEngineDataDir(), 'userConfig.json');
}

function resolveDataPath(...segments) {
  return path.join(getEngineDataDir(), ...segments);
}

const isDev = !isPackaged();

module.exports = {
  isDev,
  getEngineDataDir,
  initDataDir,
  getHoldingsFilePath,
  getUserConfigPath,
  resolveDataPath,
};
