import fs from 'fs';
import path from 'path';
import { writeEvent } from './eventWriter.js';

const SNAPSHOT_DIR = path.resolve('engine/snapshots');
const EVENTS_FILE = path.join(SNAPSHOT_DIR, 'learning_events.json');

export function registerEvent(type, payload) {
  writeEvent({ type, payload });
}

export function getPersistedEvents() {
  if (!fs.existsSync(EVENTS_FILE)) return [];
  return JSON.parse(fs.readFileSync(EVENTS_FILE, 'utf-8'));
}

