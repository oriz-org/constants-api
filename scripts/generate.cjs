#!/usr/bin/env node
/**
 * generate.cjs — parse CODATA 2022 ASCII listing into per-constant JSON files.
 *
 * Source: https://physics.nist.gov/cuu/Constants/Table/allascii.txt
 * Frozen copy: scripts/codata2022.txt (committed for reproducibility)
 *
 * Outputs (at repo root; prebuild.cjs mirrors into public/ for Astro):
 *   constants/<slug>.json   — one record per constant
 *   index.json              — array of slugs
 *   all.json                — array of full records
 *   categories.json         — array of category names + counts
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(__dirname, 'codata2022.txt');
const CONSTS_DIR = path.join(ROOT, 'constants');

fs.mkdirSync(CONSTS_DIR, { recursive: true });

const raw = fs.readFileSync(SRC, 'utf8');
const lines = raw.split('\n');

// Find data start: line after the dashed separator
let dataStart = lines.findIndex((l) => /^-{20,}/.test(l));
if (dataStart < 0) throw new Error('Could not find dashed separator');
dataStart += 1;

// Column boundaries determined empirically from the NIST allascii.txt layout
// (the header positions are shifted by 2 vs the data rows — header has a leading
// "  " indent but data rows do not, and values are right-padded into a 25-char column).
const valueCol = 60;
const uncCol = 85;
const unitCol = 109;

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/\./g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Category routing — based on the CODATA grouping in the 2022 fundamental constants summary
// (https://physics.nist.gov/cuu/Constants/). Keyword match on the constant name.
function categoryFor(name) {
  const n = name.toLowerCase();
  if (
    /^speed of light/.test(n) ||
    /newtonian constant of gravitation/.test(n) ||
    /^planck constant/.test(n) ||
    /^reduced planck constant/.test(n) ||
    /^planck (mass|length|time|temperature)/.test(n) ||
    /vacuum (electric permittivity|mag\. permeability)/.test(n) ||
    /characteristic impedance of vacuum/.test(n)
  ) return 'universal';

  if (
    /elementary charge/.test(n) ||
    /magneton/.test(n) ||
    /magnetic flux quantum/.test(n) ||
    /mag\. flux quantum/.test(n) ||
    /conductance quantum/.test(n) ||
    /josephson constant/.test(n) ||
    /von klitzing constant/.test(n) ||
    /fine-structure constant/.test(n) ||
    /inverse fine-structure/.test(n) ||
    /mag\. (moment|mom\.)/.test(n) ||
    /\bg factor\b/.test(n)
  ) return 'electromagnetic';

  if (
    /avogadro constant/.test(n) ||
    /boltzmann constant/.test(n) ||
    /molar (gas|mass|volume|planck)/.test(n) ||
    /faraday constant/.test(n) ||
    /stefan-boltzmann/.test(n) ||
    /wien/.test(n) ||
    /(first|second) radiation/.test(n) ||
    /loschmidt constant/.test(n) ||
    /sackur-tetrode/.test(n) ||
    /\batomic mass (unit|constant)/.test(n) ||
    /unified atomic mass unit/.test(n)
  ) return 'physico-chemical';

  if (
    /\b(electron|proton|neutron|muon|tau|deuteron|triton|helion|alpha particle)\b/.test(n) ||
    /rydberg/.test(n) ||
    /bohr radius/.test(n) ||
    /compton wavelength/.test(n) ||
    /classical electron radius/.test(n) ||
    /hartree energy/.test(n) ||
    /thomson cross section/.test(n) ||
    /atomic unit/.test(n) ||
    /hyperfine/.test(n) ||
    /quantum of circulation/.test(n) ||
    /fermi coupling/.test(n) ||
    /weak mixing angle/.test(n) ||
    /w to z mass/.test(n) ||
    /angstrom star/.test(n) ||
    /natural unit/.test(n) ||
    /lattice (parameter|spacing) of /.test(n) ||
    / x unit$/.test(n) ||
    /shielding difference/.test(n)
  ) return 'atomic-and-nuclear';

  if (/luminous efficacy/.test(n)) return 'photometric';

  if (
    /standard acceleration of gravity/.test(n) ||
    /standard atmosphere/.test(n) ||
    /standard-state pressure/.test(n) ||
    /conventional value/.test(n) ||
    /electron volt/.test(n) ||
    /\brelationship\b/.test(n)
  ) return 'conversions-and-adopted';

  return 'other';
}

const records = [];
const seen = new Map();

for (let i = dataStart; i < lines.length; i++) {
  const line = lines[i];
  if (!line.trim()) continue;

  const name = line.slice(0, valueCol).trim();
  const valueRaw = line.slice(valueCol, uncCol).trim();
  const uncRaw = line.slice(uncCol, unitCol).trim();
  const unit = line.slice(unitCol).trim();
  if (!name || !valueRaw) continue;

  const isExact = /\(exact\)/i.test(uncRaw) || /\.\.\./.test(valueRaw);

  const valueStr = valueRaw.replace(/\s+/g, '').replace(/\.\.\./g, '');
  const uncertaintyStr = isExact ? null : uncRaw.replace(/\s+/g, '');
  const valueNum = Number(valueStr);
  const uncertaintyNum =
    uncertaintyStr && /^[\d.+\-eE]+$/.test(uncertaintyStr)
      ? Number(uncertaintyStr)
      : null;

  let slug = slugify(name);
  if (seen.has(slug)) {
    const n = seen.get(slug) + 1;
    seen.set(slug, n);
    slug = `${slug}-${n}`;
  } else {
    seen.set(slug, 1);
  }

  records.push({
    slug,
    name,
    value: Number.isFinite(valueNum) ? valueNum : valueStr,
    value_string: valueRaw,
    uncertainty: Number.isFinite(uncertaintyNum) ? uncertaintyNum : null,
    uncertainty_string: isExact ? 'exact' : uncRaw,
    unit: unit || null,
    exact: isExact,
    category: categoryFor(name),
    source: 'CODATA 2022 (NIST)',
    source_url: 'https://physics.nist.gov/cuu/Constants/',
  });
}

for (const r of records) {
  fs.writeFileSync(
    path.join(CONSTS_DIR, `${r.slug}.json`),
    JSON.stringify(r, null, 2) + '\n'
  );
}

const sorted = [...records].sort((a, b) => a.slug.localeCompare(b.slug));

fs.writeFileSync(
  path.join(ROOT, 'index.json'),
  JSON.stringify(sorted.map((r) => r.slug)) + '\n'
);

fs.writeFileSync(
  path.join(ROOT, 'all.json'),
  JSON.stringify(sorted, null, 2) + '\n'
);

const catCounts = {};
for (const r of records) catCounts[r.category] = (catCounts[r.category] || 0) + 1;
const categories = Object.keys(catCounts)
  .sort()
  .map((c) => ({ category: c, count: catCounts[c] }));
fs.writeFileSync(
  path.join(ROOT, 'categories.json'),
  JSON.stringify(categories, null, 2) + '\n'
);

console.log(`Generated:`);
console.log(`  ${records.length} constants in constants/`);
console.log(`  index.json (${records.length} slugs)`);
console.log(`  all.json (${records.length} entries)`);
console.log(`  categories.json (${categories.length} categories)`);
for (const c of categories) console.log(`    ${c.category}: ${c.count}`);
