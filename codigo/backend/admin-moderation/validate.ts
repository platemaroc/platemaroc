import { WEEK, type WeekHours } from '../../shared/week.ts';

/**
 * Validaciones del panel (bloque 4b). Puras y probadas en codigo/testing/admin.test.ts.
 * Nada se inventa: un campo vacío queda vacío (null), nunca con un valor por defecto que parezca real.
 */
export type Errors = Record<string, string>;
export type Result<T> = { ok: true; value: T } | { ok: false; errors: Errors };

export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** "Café Hafa (Tánger)" → "cafe-hafa-tanger". Solo sugerencia: el titular confirma el slug. */
export function slugify(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
}

export const emptyToNull = (v: unknown): string | null => {
  const s = typeof v === 'string' ? v.trim() : '';
  return s ? s : null;
};

export function checkSlug(v: unknown, errors: Errors): string {
  const s = String(v ?? '').trim();
  if (!SLUG_RE.test(s) || s.length > 80) errors.slug = 'Solo minúsculas sin acentos, números y guiones (máx. 80). Ej.: cafe-hafa';
  return s;
}

/** Coordenadas: las dos o ninguna; con 6 decimales como máximo (la columna es numeric(9,6)). */
export function checkCoords(latRaw: unknown, lngRaw: unknown, errors: Errors): { lat: number | null; lng: number | null } {
  const lat = emptyToNull(latRaw), lng = emptyToNull(lngRaw);
  if (lat === null && lng === null) return { lat: null, lng: null };
  const la = Number(lat?.replace(',', '.')), lo = Number(lng?.replace(',', '.'));
  if (lat === null || lng === null || !Number.isFinite(la) || !Number.isFinite(lo) || Math.abs(la) > 90 || Math.abs(lo) > 180) {
    errors.coords = 'Escribe las dos coordenadas (latitud entre -90 y 90, longitud entre -180 y 180) o deja las dos vacías.';
    return { lat: null, lng: null };
  }
  return { lat: Math.round(la * 1e6) / 1e6, lng: Math.round(lo * 1e6) / 1e6 };
}

export function checkPriceRange(v: unknown, errors: Errors): number | null {
  const s = emptyToNull(v);
  if (s === null) return null;
  const n = Number(s);
  if (!Number.isInteger(n) || n < 1 || n > 4) errors.price_range = 'Nivel de precios de 1 a 4, o vacío.';
  return Number.isInteger(n) ? n : null;
}

export function checkPhone(v: unknown, errors: Errors): string | null {
  const s = emptyToNull(v);
  if (s === null) return null;
  const digits = s.replace(/\D/g, '');
  if (!/^\+?[\d\s().-]+$/.test(s) || digits.length < 6 || digits.length > 15) errors.phone = 'Teléfono con prefijo, por ejemplo +212 539 12 34 56.';
  return s;
}

export function checkUrl(v: unknown, field: string, errors: Errors): string | null {
  const s = emptyToNull(v);
  if (s === null) return null;
  try {
    const u = new URL(s);
    if (u.protocol !== 'https:' && u.protocol !== 'http:') throw new Error();
    return u.toString();
  } catch {
    errors[field] = 'Dirección web completa, empezando por https://';
    return s;
  }
}

const RANGE = String.raw`(\d{1,2}):(\d{2})\s*[–-]\s*(\d{1,2}):(\d{2})`;
const DAY_RE = new RegExp(`^${RANGE}(\\s*,\\s*${RANGE})*$`);

/** Horario por día: "9:00–13:00, 16:00–20:00" o vacío (cerrado). Se normaliza el guion a "–". */
export function checkWeekHours(form: (key: string) => unknown, errors: Errors): WeekHours | null {
  const out: WeekHours = {};
  for (const day of WEEK) {
    const raw = emptyToNull(form(`hours_${day}`));
    if (raw === null) continue;
    const ok = DAY_RE.test(raw) && [...raw.matchAll(/(\d{1,2}):(\d{2})/g)].every(([, h, m]) => Number(h) <= 24 && Number(m) <= 59);
    if (!ok) { errors[`hours_${day}`] = 'Formato 9:00–13:00, y varios tramos separados por comas. Vacío = cerrado.'; continue; }
    out[day] = raw.replace(/\s*[–-]\s*/g, '–').replace(/\s*,\s*/g, ', ');
  }
  return Object.keys(out).length ? out : null;
}

/** Textos de una traducción. El título es obligatorio para revisar o publicar, no para guardar un borrador. */
export interface TranslationInput { title: string | null; description: string | null; content: string | null; seo_title: string | null; seo_description: string | null; directions: string | null }

export function checkTranslation(form: (key: string) => unknown, withDirections: boolean): Result<TranslationInput> {
  const errors: Errors = {};
  const value: TranslationInput = {
    title: emptyToNull(form('title')), description: emptyToNull(form('description')), content: emptyToNull(form('content')),
    seo_title: emptyToNull(form('seo_title')), seo_description: emptyToNull(form('seo_description')),
    directions: withDirections ? emptyToNull(form('directions')) : null,
  };
  if ((value.title?.length ?? 0) > 120) errors.title = 'Máximo 120 caracteres.';
  if ((value.description?.length ?? 0) > 500) errors.description = 'Máximo 500 caracteres (es el resumen).';
  if ((value.seo_title?.length ?? 0) > 70) errors.seo_title = 'Máximo 70 caracteres (lo que muestra Google).';
  if ((value.seo_description?.length ?? 0) > 170) errors.seo_description = 'Máximo 170 caracteres.';
  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, value };
}

/** Derechos de una foto: si están los tres, la foto del titular puede quedar aprobada (decisión 29-10-2026). */
export function photoRightsComplete(p: { source?: string | null; author?: string | null; license?: string | null }): boolean {
  return [p.source, p.author, p.license].every((x) => typeof x === 'string' && x.trim().length > 0);
}

export function checkLines(v: unknown, max = 20): string[] {
  return String(v ?? '').split(/[\n,]/).map((x) => x.trim()).filter(Boolean).slice(0, max);
}

/** Importe en MAD: acepta coma o punto; vacío = pendiente; nunca negativo ni con más de 2 decimales. */
export function checkPriceMad(raw: unknown, errors: Errors): number | null {
  const s = String(raw ?? '').trim().replace(',', '.');
  if (!s) return null;
  if (!/^\d{1,8}(\.\d{1,2})?$/.test(s)) { errors.price_mad = 'Importe en MAD, sin moneda: por ejemplo 120 o 12,50.'; return null; }
  return Number(s);
}
