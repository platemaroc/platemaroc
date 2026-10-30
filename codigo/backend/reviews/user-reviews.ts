import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { processImage } from '../admin-moderation/images.ts';
import { createAdminClient } from '../supabase/server-admin.ts';
import { CONSENT_VERSION, checkDisplayName, checkReview, MAX_REVIEW_PHOTOS } from './validate.ts';

/**
 * Acciones del propio usuario. Todo con SU sesión: las políticas RLS impiden tocar lo ajeno o aprobarse a sí mismo.
 * La única excepción es Storage: el usuario no puede subir al bucket directamente (0120), así que el servidor sube
 * con service_role DESPUÉS de procesar la imagen, siempre dentro de la carpeta del propio usuario.
 */
type Row = Record<string, any>;
type Get = (k: string) => FormDataEntryValue | null;
export type ReviewCode = 'ok' | 'rating' | 'comment' | 'visited_on' | 'consent' | 'photo_consent' | 'name' | 'place' | 'limit' | 'photos_limit' | 'photo_invalid' | 'generic';

const BUCKET = 'fotos';

export async function getProfile(db: SupabaseClient, userId: string): Promise<{ display_name: string | null }> {
  const { data } = await db.from('profiles').select('display_name').eq('id', userId).maybeSingle();
  return { display_name: data?.display_name ?? null };
}

export async function setDisplayName(db: SupabaseClient, userId: string, raw: unknown): Promise<boolean> {
  const name = checkDisplayName(raw);
  if (!name) return false;
  return !(await db.from('profiles').update({ display_name: name }).eq('id', userId)).error;
}

/** Lugar publicado por tipo y slug (RLS: un borrador no aparece) y la reseña propia, si existe. */
export async function reviewContext(db: SupabaseClient, userId: string, section: string, slug: string) {
  const { data: place } = await db.from('places').select('id,slug,place_type_id,place_types(slug)').eq('slug', slug).maybeSingle();
  const typeSlug = (place?.place_types as unknown as { slug?: string } | null)?.slug;
  if (!place || typeSlug !== section) return null;
  const { data: own } = await db.from('reviews').select('*').eq('user_id', userId).eq('place_id', place.id).maybeSingle();
  const { data: title } = await db.from('translations').select('title,locale').eq('entity_type', 'place').eq('entity_id', place.id).eq('status', 'publicada');
  const photos = own ? (await db.from('photos').select('id').eq('review_id', own.id)).data ?? [] : [];
  return { placeId: place.id as string, titles: Object.fromEntries((title ?? []).map((t) => [t.locale, t.title])) as Record<string, string>, own: own as Row | null, photoCount: photos.length };
}

export async function submitReview(db: SupabaseClient, userId: string, placeId: string, get: Get, files: File[]): Promise<ReviewCode> {
  const checked = checkReview(get);
  if (!checked.value) return checked.errors[0];
  if (get('consent') !== 'on') return 'consent';
  const photos = files.filter((f) => f.size > 0);
  if (photos.length && get('photo_consent') !== 'on') return 'photo_consent';
  const { display_name: name } = await getProfile(db, userId);
  if (!name) return 'name';

  // Las fotos se validan antes de guardar nada: un archivo inválido no deja una reseña a medias.
  const processed: Buffer[] = [];
  for (const f of photos) {
    const r = await processImage(await f.arrayBuffer());
    if (!r.ok) return 'photo_invalid';
    processed.push(r.data);
  }

  const { data: own } = await db.from('reviews').select('id').eq('user_id', userId).eq('place_id', placeId).maybeSingle();
  const existing = own ? ((await db.from('photos').select('id').eq('review_id', own.id)).data ?? []).length : 0;
  if (existing + processed.length > MAX_REVIEW_PHOTOS) return 'photos_limit';

  // Crear o editar deja siempre la reseña en pendiente: editar la devuelve a moderación.
  const values = { ...checked.value, status: 'pendiente', rejection_reason: null };
  const saved = own
    ? await db.from('reviews').update(values).eq('id', own.id).select('id').single()
    : await db.from('reviews').insert({ ...values, user_id: userId, place_id: placeId }).select('id').single();
  if (saved.error) return /reviews_daily_limit/.test(saved.error.message) ? 'limit' : 'generic';
  const reviewId = saved.data.id as string;

  const consents = [{ user_id: userId, purpose: 'resena', version: CONSENT_VERSION, granted: true }];
  if (processed.length) consents.push({ user_id: userId, purpose: 'fotos_resena', version: CONSENT_VERSION, granted: true });
  if ((await db.from('consents').insert(consents)).error) return 'generic';

  const storage = createAdminClient().storage.from(BUCKET);
  for (const data of processed) {
    const path = `${userId}/${crypto.randomUUID()}.webp`;
    const up = await storage.upload(path, data, { contentType: 'image/webp', upsert: false });
    if (up.error) return 'generic';
    const row = await db.from('photos').insert({
      user_id: userId, review_id: reviewId, storage_path: path, status: 'pendiente',
      source: 'usuario', author: name, license: `Cedida por el usuario (consentimiento ${CONSENT_VERSION})`,
    });
    if (row.error) { await storage.remove([path]); return /photos_per_review_limit/.test(row.error.message) ? 'photos_limit' : 'generic'; }
  }
  return 'ok';
}

export async function listOwnReviews(db: SupabaseClient, userId: string): Promise<Row[]> {
  const { data } = await db.from('reviews').select('id,rating,comment,status,rejection_reason,created_at,place_id,places(slug,place_types(slug))').eq('user_id', userId).order('created_at', { ascending: false });
  const rows = (data ?? []) as Row[];
  const ids = rows.map((r) => r.place_id);
  const { data: titles } = ids.length ? await db.from('translations').select('entity_id,title,locale').eq('entity_type', 'place').in('entity_id', ids) : { data: [] };
  return rows.map((r) => ({ ...r, titles: Object.fromEntries((titles ?? []).filter((t) => t.entity_id === r.place_id).map((t) => [t.locale, t.title])) }));
}

/** El usuario puede borrar su reseña (modelo de datos): también sus fotos y archivos. Solo dentro de su propia carpeta. */
export async function deleteOwnReview(db: SupabaseClient, userId: string, reviewId: string): Promise<boolean> {
  const { data: review } = await db.from('reviews').select('id').eq('id', reviewId).eq('user_id', userId).maybeSingle();
  if (!review) return false;
  const paths = ((await db.from('photos').select('storage_path').eq('review_id', reviewId)).data ?? []).map((p) => p.storage_path as string).filter((p) => p.startsWith(`${userId}/`));
  if ((await db.from('reviews').delete().eq('id', reviewId).eq('user_id', userId)).error) return false;
  if (paths.length) await createAdminClient().storage.from(BUCKET).remove(paths);
  return true;
}
