import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { canTransition } from '../../shared/states.ts';
import { REJECTION_LABEL, REJECTION_REASONS } from '../reviews/validate.ts';
import { recordAudit } from './audit-writer.ts';
import { panelAudit } from './audit.ts';
import type { SaveResult } from './content-admin.ts';

/** Moderación con la sesión del administrador (RLS) y auditoría. Las respuestas solo llegan a "aprobada": publicar es Fase 2 (maestro §3). */
type Row = Record<string, any>;

export async function listReviews(db: SupabaseClient, status: string): Promise<Row[]> {
  const { data, error } = await db.from('reviews').select('*').eq('status', status).order('created_at').limit(100);
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as Row[];
  if (!rows.length) return [];
  const ids = rows.map((r) => r.id);
  const [{ data: profiles }, { data: places }, { data: titles }, { data: photos }, { data: replies }] = await Promise.all([
    db.from('profiles').select('id,display_name').in('id', rows.map((r) => r.user_id)),
    db.from('places').select('id,slug').in('id', rows.map((r) => r.place_id)),
    db.from('translations').select('entity_id,title').eq('entity_type', 'place').eq('locale', 'es').in('entity_id', rows.map((r) => r.place_id)),
    db.from('photos').select('id,review_id,status,storage_path').in('review_id', ids),
    db.from('review_replies').select('*').in('review_id', ids),
  ]);
  return Promise.all(rows.map(async (r) => ({
    ...r,
    author: profiles?.find((p) => p.id === r.user_id)?.display_name ?? '(sin nombre)',
    place: titles?.find((t) => t.entity_id === r.place_id)?.title ?? places?.find((p) => p.id === r.place_id)?.slug ?? '?',
    reply: replies?.find((x) => x.review_id === r.id) ?? null,
    photos: await Promise.all((photos ?? []).filter((p) => p.review_id === r.id).map(async (p) => ({
      ...p, preview: (await db.storage.from('fotos').createSignedUrl(p.storage_path, 600)).data?.signedUrl ?? null,
    }))),
  })));
}

export async function moderateReview(db: SupabaseClient, id: string, to: string, reasonKey: string | null, note: string | null, adminEmail: string): Promise<SaveResult> {
  const { data: review } = await db.from('reviews').select('id,status').eq('id', id).maybeSingle();
  if (!review) return { ok: false, errors: { _: 'No existe.' } };
  const label = (REJECTION_REASONS as readonly string[]).includes(reasonKey ?? '') ? REJECTION_LABEL[reasonKey as keyof typeof REJECTION_LABEL] : null;
  const reason = to === 'rechazada' ? [label, note?.trim()].filter(Boolean).join(': ') || null : null;
  const check = canTransition('resena', review.status, to, 'admin', { reason: reason ?? undefined });
  if (!check.allowed) return { ok: false, errors: { status: check.reason ?? 'No permitido.' } };
  const { error } = await db.from('reviews').update({ status: to, rejection_reason: reason }).eq('id', id);
  if (error) throw new Error(error.message);
  await recordAudit(panelAudit(adminEmail, { entidad_tipo: 'review', entidad_id: id, accion: 'moderar', campo: 'status', valor_anterior: review.status, valor_nuevo: to, motivo: reason }));
  return { ok: true, id };
}

/** Pendientes y sus datos. Las fotos de reseña exigen el alt en el idioma de la reseña (decisión del 30-10-2026). */
export async function listPhotos(db: SupabaseClient, status: string): Promise<Row[]> {
  const { data, error } = await db.from('photos').select('*').eq('status', status).order('created_at').limit(100);
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as Row[];
  if (!rows.length) return [];
  const [{ data: alts }, { data: reviews }] = await Promise.all([
    db.from('photo_translations').select('*').in('photo_id', rows.map((p) => p.id)),
    db.from('reviews').select('id,locale,place_id').in('id', rows.map((p) => p.review_id).filter(Boolean)),
  ]);
  return Promise.all(rows.map(async (p) => ({
    ...p,
    alts: Object.fromEntries((alts ?? []).filter((a) => a.photo_id === p.id).map((a) => [a.locale, a.alt])),
    altLocale: reviews?.find((r) => r.id === p.review_id)?.locale ?? 'es',
    preview: (await db.storage.from('fotos').createSignedUrl(p.storage_path, 600)).data?.signedUrl ?? null,
  })));
}

/** Borrador de respuesta y su aprobación. Nunca pasa a `publicada` en el MVP. */
export async function saveReply(db: SupabaseClient, reviewId: string, body: string | null, approve: boolean, adminEmail: string): Promise<SaveResult> {
  const text = body?.trim();
  if (!text) return { ok: false, errors: { body: 'Escribe la respuesta.' } };
  if (text.length > 1000) return { ok: false, errors: { body: 'Máximo 1000 caracteres.' } };
  const { data: current } = await db.from('review_replies').select('*').eq('review_id', reviewId).maybeSingle();
  if (current?.status === 'publicada') return { ok: false, errors: { _: 'Ya está publicada.' } };
  const to = approve ? 'aprobada_por_titular' : 'borrador';
  const from = current?.status ?? 'borrador';
  if (from !== to) {
    const check = canTransition('respuesta', from, to, 'admin');
    if (!check.allowed) return { ok: false, errors: { status: check.reason ?? 'No permitido.' } };
  }
  const { error } = current
    ? await db.from('review_replies').update({ body: text, status: to }).eq('id', current.id)
    : await db.from('review_replies').insert({ review_id: reviewId, body: text, status: to });
  if (error) throw new Error(error.message);
  await recordAudit(panelAudit(adminEmail, { entidad_tipo: 'review', entidad_id: reviewId, accion: 'respuesta', campo: 'review_replies', valor_anterior: current?.body ?? null, valor_nuevo: { body: text, status: to } }));
  return { ok: true, id: reviewId };
}
