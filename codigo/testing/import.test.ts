// node --test codigo/testing/import.test.ts — importación CSV (bloque 4d)
import test from 'node:test';
import assert from 'node:assert/strict';
import { csvTemplate, MAX_ROWS, parseCsv, validateCsv, type ImportContext } from '../backend/admin-moderation/csv-import.ts';

const ctx = (): ImportContext => ({
  types: [{ id: 't1', keys: ['restaurantes'] }, { id: 't2', keys: ['cafes-y-teterias'] }],
  cities: [{ id: 'c1', keys: ['tanger'] }, { id: 'c2', keys: ['fes'] }],
  neighborhoods: [{ id: 'n1', city_id: 'c1', keys: ['medina'] }],
  existingSlugs: new Set(['ya-existe']),
});

test('CSV: admite punto y coma, comillas, BOM y saltos de línea de Windows', () => {
  assert.deepEqual(parseCsv('﻿a;b\r\n"x;1";"di ""y"""\r\n'), [['a', 'b'], ['x;1', 'di "y"']]);
  assert.deepEqual(parseCsv('a,b\n1,2\n\n'), [['a', 'b'], ['1', '2']]);
});

test('CSV: fila correcta en borrador, tipo y ciudad como en la web, sin inventar lo vacío', () => {
  const r = validateCsv('nombre;tipo;ciudad;barrio;lunes\nCafé Hafa;Cafés y teterías;Tánger;Medina;9:00-13:00\n', ctx());
  assert.equal(r.errors.length, 0);
  const v = r.rows[0].values;
  assert.equal(v.slug, 'cafe-hafa');
  assert.equal(v.status, 'borrador');
  assert.equal(v.place_type_id, 't2');
  assert.equal(v.neighborhood_id, 'n1');
  assert.deepEqual(v.opening_hours, { mon: '9:00–13:00' });
  assert.equal(v.address, null);
  assert.equal(v.lat, null);
  assert.equal(v.phone, null);
});

test('CSV: errores por fila con su número, y duplicados aparte', () => {
  const r = validateCsv([
    'nombre;tipo;ciudad;latitud;longitud;nivel_precio',
    'Bueno;restaurantes;fes;;;',
    ';restaurantes;fes;;;',
    'Tipo raro;bar;fes;;;',
    'Ciudad rara;restaurantes;Atlantis;;;',
    'Coordenadas;restaurantes;fes;35.7;;',
    'Precio;restaurantes;fes;;;9',
    'Ya existe;restaurantes;fes;;;',
    'Bueno;restaurantes;fes;;;',
  ].join('\n'), ctx());
  assert.deepEqual(r.rows.map((x) => x.line), [2]);
  assert.deepEqual(r.errors.map((e) => e.line), [3, 4, 5, 6, 7]);
  assert.match(r.errors[2].message, /ciudad desconocida "Atlantis"/);
  assert.deepEqual(r.duplicates.map((d) => d.line), [8, 9]);
});

test('CSV: el barrio debe ser de esa ciudad', () => {
  assert.match(validateCsv('nombre;tipo;ciudad;barrio\nX;restaurantes;fes;Medina\n', ctx()).errors[0].message, /barrio desconocido/);
});

test('CSV: rechaza lo que no es la plantilla', () => {
  assert.match(validateCsv('\u0000PK binario', ctx()).fatal ?? '', /CSV de texto/);
  assert.match(validateCsv('solo cabecera;x\n', ctx()).fatal ?? '', /filas/);
  assert.match(validateCsv('nombre;tipo\nx;y\n', ctx()).fatal ?? '', /ciudad/);
  assert.match(validateCsv('nombre;tipo;ciudad;precio_usd\nx;y;z;1\n', ctx()).fatal ?? '', /desconocidas/);
  const many = `nombre;tipo;ciudad\n${'x;restaurantes;fes\n'.repeat(MAX_ROWS + 1)}`;
  assert.match(validateCsv(many, ctx()).fatal ?? '', /Máximo/);
});

test('plantilla: solo cabeceras, sin datos de ejemplo, y se puede leer de vuelta', () => {
  const table = parseCsv(csvTemplate());
  assert.equal(table.length, 1);
  assert.ok(table[0].includes('nombre') && table[0].includes('domingo'));
});
