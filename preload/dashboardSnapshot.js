import { contextBridge } from 'electron';
import fs from 'fs';
import path from 'path';

const SNAPSHOT_PATH = path.join(
  process.cwd(),
  'engine/portfolio/portfolioSnapshot.json'
);

contextBridge.exposeInMainWorld('dashboardAPI', {
  readSnapshot: () => {
    try {
      if (!fs.existsSync(SNAPSHOT_PATH)) return null;
      const raw = fs.readFileSync(SNAPSHOT_PATH, 'utf-8');
      return JSON.parse(raw);
    } catch (err) {
      return null;
    }
  }
});

