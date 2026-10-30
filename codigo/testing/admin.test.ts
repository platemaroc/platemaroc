// node --test codigo/testing/admin.test.ts — panel de contenido (bloque 4b)
import test from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import {
  checkCoords, checkPhone, checkPriceRange, checkSlug, checkTranslation, checkUrl, checkWeekHours, photoRightsComplete, slugify,
} from '../backend/admin-moderation/validate.ts';
import { processImage } from '../backend/admin-moderation/images.ts';
import { previewGate } from '../backend/admin-moderation/gate-preview.ts';
import { ENTITIES, ADMIN_ENTITIES } from '../backend/admin-moderation/entities.ts';
import { AUDIT_ENTITIES } from '../backend/admin-moderation/audit.ts';

test('slug: sugerencia sin acentos y validación estricta', () => {
  assert.equal(slugify('Café Hafa (Tánger)'), 'cafe-hafa-tanger');
  for (const ok of ['cafe-hafa', 'tanger', 'a1-b2']) { const e = {}; checkSlug(ok, e); assert.deepEqual(e, {}, ok); }
  for (const bad of ['Café', 'cafe--hafa', '-cafe', 'cafe_hafa', '', 'a'.repeat(81)]) { const e: Record<string, string> = {}; checkSlug(bad, e); assert.ok(e.slug, bad); }
});

test('coordenadas: las dos o ninguna, con coma o punto, en rango y redondeadas a 6 decimales', () => {
  const e: Record<string, string> = {};
  assert.deepEqual(checkCoords('35,78361234', '-5.8125', e), { lat: 35.783612, lng: -5.8125 });
  assert.deepEqual(checkCoords('', '', e), { lat: null, lng: null });
  assert.deepEqual(e, {});
  for (const [a, b] of [['35.7', ''], ['95', '1'], ['x', '1']]) { const err: Record<string, string> = {}; checkCoords(a, b, err); assert.ok(err.coords, `${a},${b}`); }
});

test('horario por días: normaliza guiones y comas; vacío = cerrado; rechaza formatos raros', () => {
  const f = (v: Record<string, string>) => (k: string) => v[k] ?? null;
  const e: Record<string, string> = {};
  assert.deepEqual(checkWeekHours(f({ hours_mon: '9:00-13:00 ,16:00 - 20:00', hours_sun: '' }), e), { mon: '9:00–13:00, 16:00–20:00' });
  assert.deepEqual(e, {});
  assert.equal(checkWeekHours(f({}), {}), null);
  for (const bad of ['mañana', '9-13', '25:00–26:00', '9:00–13:70']) { const err: Record<string, string> = {}; checkWeekHours(f({ hours_tue: bad }), err); assert.ok(err.hours_tue, bad); }
});

test('teléfono, web y nivel de precios', () => {
  const e: Record<string, string> = {};
  assert.equal(checkPhone('+212 539 12 34 56', e), '+212 539 12 34 56');
  assert.equal(checkUrl('https://ejemplo.ma', 'website', e), 'https://ejemplo.ma/');
  assert.equal(checkPriceRange('3', e), 3);
  assert.deepEqual(e, {});
  const bad: Record<string, string> = {};
  checkPhone('llamar', bad); checkUrl('javascript:alert(1)', 'website', bad); checkPriceRange('5', bad);
  assert.deepEqual(Object.keys(bad).sort(), ['phone', 'price_range', 'website']);
});

test('traducción: límites de longitud y sin indicaciones fuera de los lugares', () => {
  const ok = checkTranslation((k) => ({ title: ' Hafa ', directions: 'Bajar por…' } as Record<string, string>)[k] ?? null, false);
  assert.ok(ok.ok && ok.value.title === 'Hafa' && ok.value.directions === null);
  const long = checkTranslation((k) => (k === 'seo_title' ? 'x'.repeat(71) : null), true);
  assert.ok(!long.ok && long.errors.seo_title);
});

test('foto: derechos completos solo con origen, autor y licencia', () => {
  assert.equal(photoRightsComplete({ source: 'propia', author: 'Titular', license: 'Todos los derechos' }), true);
  assert.equal(photoRightsComplete({ source: 'propia', author: ' ', license: 'x' }), false);
});

test('imágenes: quita EXIF y GPS, reduce a 1600 px, convierte a WebP y rechaza lo que no es imagen', async () => {
  const withGps = await sharp({ create: { width: 3000, height: 2000, channels: 3, background: '#a33' } })
    .jpeg().withExif({ IFD0: { Artist: 'prueba' }, IFD3: { GPSLatitudeRef: 'N', GPSLatitude: '35/1 47/1 0/1' } }).toBuffer();
  const noGps = await sharp({ create: { width: 3000, height: 2000, channels: 3, background: '#a33' } }).jpeg().withExif({ IFD0: { Artist: 'prueba' } }).toBuffer();
  const exifBytes = async (b: Buffer) => (await sharp(b).metadata()).exif?.length ?? 0;
  assert.ok((await exifBytes(withGps)) > (await exifBytes(noGps)), 'la imagen de prueba lleva GPS de verdad');
  const out = await processImage(withGps);
  assert.ok(out.ok);
  const meta = await sharp(out.data).metadata();
  assert.equal(meta.format, 'webp');
  assert.equal(meta.width, 1600);
  assert.equal(meta.exif, undefined, 'sin EXIF/GPS');
  const fake = await processImage(Buffer.from('<svg onload="alert(1)"></svg>'));
  assert.ok(!fake.ok);
  assert.ok(!(await processImage(Buffer.alloc(0))).ok);
});

test('Quality Gate en el panel: nunca APTO por suposición (duplicidad sin comprobar → PENDIENTE como mínimo)', () => {
  const row = { status: 'publicado', lat: 35.78, lng: -5.81, city_id: 'c', neighborhood_id: 'n', verification_status: 'verificado' };
  const t = { status: 'publicada', title: 'X', description: 'x'.repeat(400), seo_title: 'x', seo_description: 'y' };
  const [es] = previewGate('lugares', {
    row, translations: { es: t }, relations: { platos: ['d1'] }, photos: [{ status: 'aprobada', alts: { es: 'alt' } }], inboundLinks: 2,
  });
  assert.equal(es.locale, 'es');
  assert.equal(es.result, 'PENDIENTE');
  assert.deepEqual(es.failures, []);
  assert.ok(es.unchecked.some((u) => /Duplicidad/.test(u)));
  const [noPhoto] = previewGate('lugares', { row, translations: { es: t }, relations: {}, photos: [], inboundLinks: 0 });
  assert.equal(noPhoto.result, 'NO APTO');
  assert.equal(previewGate('regiones', { row, translations: {}, relations: {}, photos: [] }).length, 0);
});

test('tipos del panel: cada uno con tabla, tipo de traducción y tipo de auditoría válido', () => {
  for (const key of ADMIN_ENTITIES) {
    const def = ENTITIES[key];
    assert.ok(def.table && def.type);
    assert.ok((AUDIT_ENTITIES as readonly string[]).includes(def.audit), `${key}: ${def.audit}`);
    for (const r of def.relations) assert.ok(ADMIN_ENTITIES.includes(r.other));
  }
});
