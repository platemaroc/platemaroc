#!/usr/bin/env node
// Busca secretos evidentes antes de hacer commit o empaquetar. Uso: node codigo/security/scan-secrets.mjs [directorio]
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, basename } from 'node:path';

const PATTERNS = [
  ['clave privada', /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/],
  ['JWT', /eyJ[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{10,}/],
  ['clave AWS', /AKIA[0-9A-Z]{16}/],
  ['clave Google API', /AIza[0-9A-Za-z_-]{35}/],
  ['asignación de secreto', /(?:SECRET|TOKEN|PASSWORD|PASSWD|API_KEY|SERVICE_ROLE_KEY|PRIVATE_KEY)\w*\s*[=:]\s*['"]?[A-Za-z0-9/+_.\-]{16,}/i],
];
const SKIP_DIRS = new Set(['node_modules', '.git', '.next']);
const hits = [];

function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) { if (!SKIP_DIRS.has(name)) walk(p); continue; }
    if (/^\.env(\..+)?$/.test(basename(p)) && !/\.(example|template)$/.test(basename(p))) hits.push([p, 'archivo .env real']);
    if (st.size > 2_000_000) continue;
    let text; try { text = readFileSync(p, 'utf8'); } catch { continue; }
    if (text.includes('\u0000')) continue;
    text.split('\n').forEach((line, i) => {
      for (const [label, re] of PATTERNS) if (re.test(line) && !/scan-secrets-ignore/.test(line)) hits.push([`${p}:${i + 1}`, label]);
    });
  }
}
walk(process.argv[2] ?? '.');
if (hits.length) { for (const [w, l] of hits) console.error(`POSIBLE SECRETO (${l}): ${w}`); process.exit(1); }
console.log('Sin secretos evidentes.');
