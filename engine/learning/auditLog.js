import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AUDIT_PATH = path.resolve(__dirname, '../../snapshots/audit_ledger.json');
function readAudit() { try { return JSON.parse(fs.readFileSync(AUDIT_PATH, 'utf8')); } catch { return []; } }
function writeAudit(entries) { fs.writeFileSync(AUDIT_PATH, JSON.stringify(entries.slice(-50000), null, 2)); }
export function recordAudit(event, data) {
  const ledger = readAudit();
  ledger.push({ timestamp: new Date().toISOString(), event, ...data });
  writeAudit(ledger);
}
export function getAuditTrail(limit = 100) { return readAudit().slice(-limit); }
