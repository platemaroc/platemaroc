import { WEEK } from '../../shared/week.ts';
import { checkCoords, checkPhone, checkPriceRange, checkUrl, checkWeekHours, emptyToNull, slugify, type Errors } from './validate.ts';

/**
 * Importación de lugares desde CSV (orden importar-lugares). Puro y sin base de datos: se prueba aparte.
 * Admite coma o punto y coma (Excel en español usa ";") y comillas. Nada se inventa: una columna vacía queda vacía.
 */
export const CSV_COLUMNS = ['nombre', 'tipo', 'ciudad', 'barrio', 'direccion', 'latitud', 'longitud', 'telefono', 'web', 'nivel_precio',
  'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo', 'fuente_verificacion'] as const;
const REQUIRED = ['nombre', 'tipo', 'ciudad'] as const;
const DAY_COLUMN: Record<string, string> = { mon: 'lunes', tue: 'martes', wed: 'miercoles', thu: 'jueves', fri: 'viernes', sat: 'sabado', sun: 'domingo' };
export const MAX_ROWS = 2000;
export const MAX_BYTES = 1024 * 1024;

export function parseCsv(text: string): string[][] {
  const src = text.replace(/^﻿/, '');
  const first = src.split(/\r?\n/, 1)[0] ?? '';
  const sep = (first.match(/;/g)?.length ?? 0) > (first.match(/,/g)?.length ?? 0) ? ';' : ',';
  const rows: string[][] = [];
  let row: string[] = [], cell = '', quoted = false;
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (quoted) {
      if (c === '"' && src[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === sep) { row.push(cell); cell = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && src[i + 1] === '\n') i++;
      row.push(cell); cell = '';
      if (row.some((x) => x.trim())) rows.push(row);
      row = [];
    } else cell += c;
  }
  row.push(cell);
  if (row.some((x) => x.trim())) rows.push(row);
  return rows;
}

export interface Lookup { id: string; keys: string[] }
export interface ImportContext { types: Lookup[]; cities: Lookup[]; neighborhoods: (Lookup & { city_id: string })[]; existingSlugs: Set<string> }
export interface ImportRow {
  line: number; name: string; slug: string;
  values: Record<string, unknown>;
}
export interface ImportReport { rows: ImportRow[]; errors: { line: number; message: string }[]; duplicates: { line: number; name: string; slug: string }[]; fatal?: string }

const norm = (s: string) => slugify(s);
const find = <T extends Lookup>(list: T[], v: string) => { const k = norm(v); return list.find((x) => x.keys.includes(k)); };

export function validateCsv(text: string, ctx: ImportContext): ImportReport {
  const empty: ImportReport = { rows: [], errors: [], duplicates: [] };
  if (text.includes('\u0000')) return { ...empty, fatal: 'El archivo no es un CSV de texto. En Excel: Guardar como → CSV UTF-8.' };
  const table = parseCsv(text);
  if (table.length < 2) return { ...empty, fatal: 'El archivo no tiene filas de datos.' };
  const header = table[0].map((h) => norm(h).replace(/-/g, '_'));
  const missing = REQUIRED.filter((c) => !header.includes(c));
  if (missing.length) return { ...empty, fatal: `Faltan columnas obligatorias: ${missing.join(', ')}.` };
  const unknown = header.filter((h) => h && !(CSV_COLUMNS as readonly string[]).includes(h));
  if (unknown.length) return { ...empty, fatal: `Columnas desconocidas: ${unknown.join(', ')}. Usa la plantilla.` };
  if (table.length - 1 > MAX_ROWS) return { ...empty, fatal: `Máximo ${MAX_ROWS} filas por archivo.` };

  const report: ImportReport = { rows: [], errors: [], duplicates: [] };
  const seen = new Set<string>();
  table.slice(1).forEach((cells, i) => {
    const line = i + 2;
    const cell = (c: string) => (cells[header.indexOf(c)] ?? '').trim();
    const name = cell('nombre');
    const issues: string[] = [];
    if (cells.length > header.length) issues.push('tiene más columnas que la cabecera (¿una coma sin comillas?)');
    if (!name) issues.push('falta el nombre');
    if (name.length > 120) issues.push('nombre de más de 120 caracteres');
    const type = cell('tipo') ? find(ctx.types, cell('tipo')) : undefined;
    if (!type) issues.push(cell('tipo') ? `tipo desconocido "${cell('tipo')}"` : 'falta el tipo');
    const city = cell('ciudad') ? find(ctx.cities, cell('ciudad')) : undefined;
    if (!city) issues.push(cell('ciudad') ? `ciudad desconocida "${cell('ciudad')}": créala antes en el panel` : 'falta la ciudad');
    const hood = cell('barrio') ? find(ctx.neighborhoods.filter((n) => n.city_id === city?.id), cell('barrio')) : undefined;
    if (cell('barrio') && !hood) issues.push(`barrio desconocido "${cell('barrio')}" en esa ciudad`);

    const errs: Errors = {};
    const coords = checkCoords(cell('latitud'), cell('longitud'), errs);
    const price_range = checkPriceRange(cell('nivel_precio'), errs);
    const phone = checkPhone(cell('telefono'), errs);
    const website = checkUrl(cell('web'), 'website', errs);
    const opening_hours = checkWeekHours((k) => (WEEK as readonly string[]).includes(k.slice(6)) ? cell(DAY_COLUMN[k.slice(6)]) : null, errs);
    issues.push(...Object.values(errs));

    const slug = slugify(name);
    if (name && !slug) issues.push('no se puede generar el slug');
    if (issues.length) { report.errors.push({ line, message: issues.join('; ') }); return; }
    if (seen.has(slug) || ctx.existingSlugs.has(slug)) { report.duplicates.push({ line, name, slug }); return; }
    seen.add(slug);
    report.rows.push({
      line, name, slug,
      values: {
        slug, place_type_id: type!.id, city_id: city!.id, neighborhood_id: hood?.id ?? null, address: emptyToNull(cell('direccion')), ...coords,
        price_range, phone, website, opening_hours, verification_source: emptyToNull(cell('fuente_verificacion')), status: 'borrador',
      },
    });
  });
  return report;
}

/** Plantilla con punto y coma y BOM: Excel en español la abre en columnas y con acentos. Solo cabeceras: ningún dato de ejemplo. */
export const csvTemplate = (): string => `﻿${CSV_COLUMNS.join(';')}\r\n`;
