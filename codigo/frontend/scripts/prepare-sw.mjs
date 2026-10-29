#!/usr/bin/env node
// Copia public/sw.js (raíz del repositorio, fuente única) a codigo/frontend/public/sw.js antes de dev/build,
// inyectando la VERSION con el commit actual (docs/13: la versión debe cambiar en cada despliegue).
import { execSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const src = join(here, '../../../public/sw.js');
const dest = join(here, '../public/sw.js');

let rev;
try {
  rev = execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
  if (execSync('git status --porcelain', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim()) rev += '-dirty';
} catch {
  rev = String(Date.now());
}

const code = readFileSync(src, 'utf8');
const pattern = /const VERSION = '([^']+)';/;
const match = code.match(pattern);
if (!match) throw new Error(`No se encuentra "const VERSION = '...'" en ${src}`);
const version = `${match[1]}-${rev}`;

mkdirSync(dirname(dest), { recursive: true });
writeFileSync(dest, code.replace(pattern, `const VERSION = '${version}';`));
console.log(`sw.js preparado (VERSION ${version})`);
