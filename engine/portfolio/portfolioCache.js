import fs from 'fs';
import path from 'path';

const CACHE_PATH = path.resolve(process.cwd(), 'engine/portfolio/portfolio.snapshot.json');

export function writePortfolioSnapshot(snapshot) {
  fs.writeFileSync(CACHE_PATH, JSON.stringify(snapshot, null, 2), 'utf-8');
}

export function readPortfolioSnapshot() {
  if (!fs.existsSync(CACHE_PATH)) return null;
  return JSON.parse(fs.readFileSync(CACHE_PATH, 'utf-8'));
}

