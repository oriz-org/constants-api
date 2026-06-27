#!/usr/bin/env node
/**
 * prebuild.cjs — mirror the repo-root data directory into public/ so Astro
 * includes it in dist/. Keeps the canonical data at repo root for
 * jsDelivr URL stability (https://cdn.jsdelivr.net/gh/oriz-org/constants-api@main/constants/<SLUG>.json).
 *
 * Hardlinks where possible (faster, atomic), falls back to copyFile.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PUB = path.join(ROOT, 'public');

const ENTRIES = ['constants', 'all.json', 'index.json', 'categories.json'];

function mirror(src, dst) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dst, { recursive: true });
    for (const name of fs.readdirSync(src)) {
      mirror(path.join(src, name), path.join(dst, name));
    }
    return;
  }
  // remove existing first (link/file)
  try { fs.unlinkSync(dst); } catch {}
  try {
    fs.linkSync(src, dst);
  } catch {
    fs.copyFileSync(src, dst);
  }
}

fs.mkdirSync(PUB, { recursive: true });

for (const entry of ENTRIES) {
  const src = path.join(ROOT, entry);
  const dst = path.join(PUB, entry);
  if (!fs.existsSync(src)) {
    console.warn(`[prebuild] missing: ${src} — skipping`);
    continue;
  }
  // wipe destination first if directory (avoid stale)
  if (fs.existsSync(dst) && fs.statSync(dst).isDirectory()) {
    fs.rmSync(dst, { recursive: true, force: true });
  }
  mirror(src, dst);
  console.log(`[prebuild] mirrored ${entry} -> public/${entry}`);
}

console.log('[prebuild] done');
