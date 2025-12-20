import fs from 'fs';
import path from 'path';

const SNAPSHOT_DIR = path.resolve('engine/snapshots');
const EVENTS_FILE = path.join(SNAPSHOT_DIR, 'learning_events.json');

function ensureStore() {
  if (!fs.existsSync(SNAPSHOT_DIR)) {
    fs.mkdirSync(SNAPSHOT_DIR, { recursive: true });
  }
  if (!fs.existsSync(EVENTS_FILE)) {
    fs.writeFileSync(EVENTS_FILE, JSON.stringify([]));
  }
}

export function writeEvent(event) {
  ensureStore();
  const existing = JSON.parse(fs.readFileSync(EVENTS_FILE, 'utf-8'));
  existing.push({
    ...event,
    ts: Date.now()
  });
  fs.writeFileSync(EVENTS_FILE, JSON.stringify(existing, null, 2));
}

