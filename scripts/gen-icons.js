#!/usr/bin/env node
/**
 * Generates build-resources/icons/icon.icns from icon-source.png
 * Requires macOS (uses sips + iconutil, both built-in).
 */
const { execSync } = require('child_process');
const fs   = require('fs');
const path = require('path');

const ROOT       = path.resolve(__dirname, '..');
const SRC_PNG    = path.join(ROOT, 'build-resources', 'icons', 'icon-source.png');
const ICONSET    = path.join(ROOT, 'build-resources', 'icons', 'icon.iconset');
const OUTPUT     = path.join(ROOT, 'build-resources', 'icons', 'icon.icns');

if (!fs.existsSync(SRC_PNG)) {
  console.error(`
  ✗ Missing: build-resources/icons/icon-source.png

  Create a 1024×1024 PNG and save it there, then re-run: npm run gen-icons

  Quick option: use any square PNG — the script just needs something to convert.
  `);
  process.exit(1);
}

fs.mkdirSync(ICONSET, { recursive: true });

const sizes = [16, 32, 64, 128, 256, 512, 1024];
for (const s of sizes) {
  const out = path.join(ICONSET, `icon_${s}x${s}.png`);
  execSync(`sips -z ${s} ${s} "${SRC_PNG}" --out "${out}" --setProperty format png 2>/dev/null`);
  if (s <= 512) {
    const s2 = s * 2;
    const out2 = path.join(ICONSET, `icon_${s}x${s}@2x.png`);
    execSync(`sips -z ${s2} ${s2} "${SRC_PNG}" --out "${out2}" --setProperty format png 2>/dev/null`);
  }
}
execSync(`iconutil -c icns "${ICONSET}" -o "${OUTPUT}"`);
fs.rmSync(ICONSET, { recursive: true, force: true });
console.log('✓ icon.icns generated at', OUTPUT);
