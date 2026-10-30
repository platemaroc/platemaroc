import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { LOCALES } from '../../shared/locales.ts';
import { canTransition } from '../../shared/states.ts';
import { recordAudit } from './audit-writer.ts';
import { panelAudit } from './audit.ts';
import { processImage } from './images.ts';
import { emptyToNull, photoRightsComplete, type Errors } from './validate.ts';
import type { SaveResult } from './content-admin.ts';

type Row = Record<string, any>;
type Form = (key: string) => FormDataEntryValue | null;
const BUCKET = 'fotos';

async function must<T>(q: PromiseLike<{ data: T; error: { message: string } | null }>): Promise<T> {
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return data;
}

async function upload(db: SupabaseClient, file: unknown, folder: string, maxWidth: number): Promise<{ ok: true; path: string } | { ok: false; error: string }> {
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: 'Elige una imagen.' };
  const processed = await processImage(await file.arrayBuffer(), maxWidth);
  if (!processed.ok) return processed;
  const path = `${folder}/${crypto.randomUUID()}.webp`;
  const { error } = await db.storage.from(BUCKET).upload(path, processed.data, { contentType: 'image/webp', upsert: false });
  if (error) return { ok: false, error: `No se pudo subir: ${error.message}` };
  return { ok: true, path };
}

/** Textos alternativos por idioma (alt_es, alt_en, alt_fr). Un alt vacío no se guarda. */
async function saveAlts(db: SupabaseClient, photoId: string, form: Form): Promise<Record<string, string>> {
  const alts: Record<string, string> = {};
  for (const l of LOCALES) {
    const alt = emptyToNull(form(`alt_${l}`));
    if (alt) alts[l] = alt.slice(0, 200);
  }
  if (Object.keys(alts).length) {
    await must(db.from('photo_translations').upsert(Object.entries(alts).map(([locale, alt]) => ({ photo_id: photoId, locale, alt })), { onConflict: 'photo_id,locale' }));
  }
  return alts;
}

/**
 * Foto del titular para una ficha. Con origen, autor y licencia queda aprobada; si falta alguno, pendiente de moderación
 * (decisión del 29-10-2026, orden moderar-fotos). Aprobar exige además el alt en español.
 */
export async function uploadPlacePhoto(db: SupabaseClient, placeId: string, form: Form, adminEmail: string): Promise<SaveResult> {
  const rights = { source: emptyToNull(form('source')), author: emptyToNull(form('author')), license: emptyToNull(form('license')) };
  const altEs = emptyToNull(form('alt_es'));
  const up = await upload(db, form('file'), `admin/places/${placeId}`, 1600);
  if (!up.ok) return { ok: false, errors: { file: up.error } };
  const status = photoRightsComplete(rights) && altEs ? 'aprobada' : 'pendiente';
  const [photo] = (await must(db.from('photos').insert({ place_id: placeId, storage_path: up.path, ...rights, status }).select('id'))) as Row[];
  const alts = await saveAlts(db, photo.id, form);
  await recordAudit(panelAudit(adminEmail, { entidad_tipo: 'photo', entidad_id: photo.id, accion: 'subir', valor_nuevo: { place_id: placeId, ...rights, status, alts } }));
  return { ok: true, id: photo.id };
}

/** Derechos, alts y moderación (aprobar / rechazar con motivo / volver a pendiente). Nunca se borra la foto. */
export async function updatePhoto(db: SupabaseClient, photoId: string, form: Form, adminEmail: string): Promise<SaveResult> {
  const [photo] = (await must(db.from('photos').select('*').eq('id', photoId).limit(1))) as Row[];
  if (!photo) return { ok: false, errors: { _: 'No existe.' } };
  const rights = { source: emptyToNull(form('source')), author: emptyToNull(form('author')), license: emptyToNull(form('license')) };
  const to = emptyToNull(form('status')) ?? photo.status;
  const reason = emptyToNull(form('rejection_reason'));
  const errors: Errors = {};
  if (to !== photo.status) {
    const check = canTransition('foto', photo.status, to, 'admin', { reason: reason ?? undefined });
    if (!check.allowed) errors.status = check.reason ?? 'No permitido.';
  }
  if (to === 'aprobada') {
    if (!photoRightsComplete(rights)) errors.status = 'Para aprobar, completa origen, autor y licencia.';
    // Fotos de reseña: el alt obligatorio es el del idioma de la reseña (decisión del 30-10-2026); el resto, en español.
    const reviewLocale = photo.review_id ? ((await must(db.from('reviews').select('locale').eq('id', photo.review_id).limit(1))) as Row[])[0]?.locale : null;
    const altLocale = reviewLocale ?? 'es';
    const [existing] = (await must(db.from('photo_translations').select('alt').eq('photo_id', photoId).eq('locale', altLocale).limit(1))) as Row[];
    if (!emptyToNull(form(`alt_${altLocale}`)) && !existing?.alt) errors[`alt_${altLocale}`] = `Para aprobar, escribe el texto alternativo en "${altLocale}".`;
  }
  // Nada se guarda si hay errores: así no quedan cambios a medias sin auditar.
  if (Object.keys(errors).length) return { ok: false, errors };
  const alts = await saveAlts(db, photoId, form);
  const update = { ...rights, status: to, rejection_reason: to === 'rechazada' ? reason : null };
  await must(db.from('photos').update(update).eq('id', photoId));
  await recordAudit(panelAudit(adminEmail, {
    entidad_tipo: 'photo', entidad_id: photoId, accion: to !== photo.status ? 'moderar' : 'editar', campo: to !== photo.status ? 'status' : null,
    valor_anterior: { source: photo.source, author: photo.author, license: photo.license, status: photo.status },
    valor_nuevo: { ...update, alts }, motivo: to === 'rechazada' ? reason : null,
  }));
  return { ok: true, id: photoId };
}

/** Imagen opcional del mapa estático de respaldo (docs/11, decisión del 29-10-2026). */
export async function setStaticMap(db: SupabaseClient, placeId: string, form: Form, adminEmail: string): Promise<SaveResult> {
  const [place] = (await must(db.from('places').select('static_map_path').eq('id', placeId).limit(1))) as Row[];
  if (!place) return { ok: false, errors: { _: 'No existe.' } };
  const up = await upload(db, form('file'), `admin/static-maps/${placeId}`, 1200);
  if (!up.ok) return { ok: false, errors: { file: up.error } };
  await must(db.from('places').update({ static_map_path: up.path }).eq('id', placeId));
  await recordAudit(panelAudit(adminEmail, { entidad_tipo: 'place', entidad_id: placeId, accion: 'editar', campo: 'static_map_path', valor_anterior: place.static_map_path, valor_nuevo: up.path }));
  return { ok: true, id: placeId };
}
