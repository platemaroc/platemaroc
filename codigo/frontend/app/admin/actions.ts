'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { isLocale } from '../../i18n/config.ts';
import { ENTITIES, isAdminEntity, type AdminEntity } from '../../../backend/admin-moderation/entities.ts';
import { changeStatus, changeTranslationStatus, saveFields, saveRelations, saveTranslation, type SaveResult } from '../../../backend/admin-moderation/content-admin.ts';
import { setStaticMap, updatePhoto, uploadEntityPhoto } from '../../../backend/admin-moderation/photos-admin.ts';
import { moderateReview, saveReply } from '../../../backend/admin-moderation/moderation-admin.ts';
import { publishMenu, saveCategory, saveItem, setItemHidden, unpublishMenu } from '../../../backend/admin-moderation/menu-admin.ts';
import { MAX_BYTES, type ImportReport } from '../../../backend/admin-moderation/csv-import.ts';
import { previewImport, runImport } from '../../../backend/admin-moderation/import-admin.ts';
import { recomputeIndexable } from '../../../backend/admin-moderation/indexing.ts';
import { clearContentCache } from '../../../backend/content/cache.ts';
import { requireAdmin } from '../../lib/admin.ts';
import { supabaseForRequest } from '../../lib/supabase-server.ts';

/** Estado que devuelven los formularios del panel. */
export interface FormState { ok?: boolean; message?: string; errors?: Record<string, string> }

const UUID = /^[0-9a-f-]{36}$/;

/** Tras un cambio guardado. Si falla no deshace el cambio: se avisa en el registro y se puede repetir en /admin/indexacion. */
async function refreshIndexable(email: string) {
  try { await recomputeIndexable(await supabaseForRequest(), email); } catch (e) { console.error('[indexable]', e); }
  clearContentCache();
}

/**
 * Común a todas las acciones: comprueba el rol (una Server Action se puede invocar sin pasar por la página),
 * valida tipo e id y refresca la ficha. Los errores inesperados se muestran sin detalles internos.
 */
async function run(form: FormData, op: (ctx: { key: AdminEntity; id: string; email: string; get: (k: string) => FormDataEntryValue | null }) => Promise<SaveResult>, okMessage = 'Guardado.'): Promise<FormState> {
  const key = String(form.get('entity') ?? '');
  const id = String(form.get('id') ?? '');
  const user = await requireAdmin(`/admin/${key}/${id}`);
  if (!isAdminEntity(key) || !UUID.test(id)) return { errors: { _: 'Petición no válida.' } };
  try {
    const result = await op({ key, id, email: user.email ?? user.id, get: (k) => form.get(k) });
    if (!result.ok) return { errors: result.errors };
    await refreshIndexable(user.email ?? user.id);
    revalidatePath(`/admin/${key}/${id}`);
    return { ok: true, message: okMessage };
  } catch (e) {
    console.error('[admin]', e);
    return { errors: { _: 'No se ha podido guardar. Inténtalo de nuevo; si se repite, avisa.' } };
  }
}

export async function createEntity(_prev: FormState, form: FormData): Promise<FormState> {
  const key = String(form.get('entity') ?? '');
  const user = await requireAdmin(`/admin/${key}/nuevo`);
  if (!isAdminEntity(key)) return { errors: { _: 'Tipo no válido.' } };
  let result: SaveResult;
  try {
    result = await saveFields(await supabaseForRequest(), key, null, (k) => form.get(k), user.email ?? user.id);
  } catch (e) {
    console.error('[admin]', e);
    return { errors: { _: 'No se ha podido crear. Inténtalo de nuevo.' } };
  }
  if (!result.ok) return { errors: result.errors };
  redirect(`/admin/${key}/${result.id}?creado=1`);
}

export async function updateFields(_prev: FormState, form: FormData): Promise<FormState> {
  return run(form, async ({ key, id, email, get }) => saveFields(await supabaseForRequest(), key, id, get, email));
}

export async function updateTranslation(_prev: FormState, form: FormData): Promise<FormState> {
  const locale = String(form.get('locale') ?? '');
  return run(form, async ({ key, id, email, get }) => (isLocale(locale)
    ? saveTranslation(await supabaseForRequest(), key, id, locale, get, email)
    : { ok: false, errors: { _: 'Idioma no válido.' } }));
}

export async function updateStatus(_prev: FormState, form: FormData): Promise<FormState> {
  const to = String(form.get('to') ?? '');
  return run(form, async ({ key, id, email }) => changeStatus(await supabaseForRequest(), key, id, to, email), 'Estado cambiado.');
}

export async function updateTranslationStatus(_prev: FormState, form: FormData): Promise<FormState> {
  const locale = String(form.get('locale') ?? '');
  const to = String(form.get('to') ?? '');
  return run(form, async ({ key, id, email }) => (isLocale(locale)
    ? changeTranslationStatus(await supabaseForRequest(), key, id, locale, to, email)
    : { ok: false, errors: { _: 'Idioma no válido.' } }), 'Estado de la traducción cambiado.');
}

export async function updateRelations(_prev: FormState, form: FormData): Promise<FormState> {
  const rel = String(form.get('relation') ?? '');
  const selected = form.getAll('selected').map(String);
  return run(form, async ({ key, id, email }) => saveRelations(await supabaseForRequest(), key, id, rel, selected, email));
}

export async function addPhoto(_prev: FormState, form: FormData): Promise<FormState> {
  return run(form, async ({ key, id, email, get }) => uploadEntityPhoto(await supabaseForRequest(), ENTITIES[key], id, get, email), 'Foto subida.');
}

export async function editPhoto(_prev: FormState, form: FormData): Promise<FormState> {
  const photoId = String(form.get('photo_id') ?? '');
  return run(form, async ({ email, get }) => (UUID.test(photoId)
    ? updatePhoto(await supabaseForRequest(), photoId, get, email)
    : { ok: false, errors: { _: 'Foto no válida.' } }), 'Foto actualizada.');
}

export async function uploadStaticMap(_prev: FormState, form: FormData): Promise<FormState> {
  return run(form, async ({ key, id, email, get }) => (key === 'lugares'
    ? setStaticMap(await supabaseForRequest(), id, get, email)
    : { ok: false, errors: { _: 'Solo los lugares tienen mapa estático.' } }), 'Mapa estático guardado.');
}

/* ---------- Moderación (bloque 4c) ---------- */

async function moderation(form: FormData, op: (ctx: { id: string; email: string }) => Promise<SaveResult>, okMessage: string, back: string): Promise<FormState> {
  const id = String(form.get('id') ?? '');
  const user = await requireAdmin(back);
  if (!UUID.test(id)) return { errors: { _: 'Petición no válida.' } };
  try {
    const result = await op({ id, email: user.email ?? user.id });
    if (!result.ok) return { errors: result.errors };
    await refreshIndexable(user.email ?? user.id);
    revalidatePath(back);
    revalidatePath('/admin');
    return { ok: true, message: okMessage };
  } catch (e) {
    console.error('[admin]', e);
    return { errors: { _: 'No se ha podido guardar. Inténtalo de nuevo.' } };
  }
}

export async function moderateReviewAction(_prev: FormState, form: FormData): Promise<FormState> {
  const to = String(form.get('to') ?? '');
  const reason = form.get('reason') ? String(form.get('reason')) : null;
  const note = form.get('note') ? String(form.get('note')) : null;
  return moderation(form, async ({ id, email }) => moderateReview(await supabaseForRequest(), id, to, reason, note, email), 'Hecho.', '/admin/resenas');
}

export async function saveReplyAction(_prev: FormState, form: FormData): Promise<FormState> {
  const approve = form.get('reply_action') === 'aprobar';
  return moderation(form, async ({ id, email }) => saveReply(await supabaseForRequest(), id, form.get('body') ? String(form.get('body')) : null, approve, email), 'Respuesta guardada (no se publica en esta fase).', '/admin/resenas');
}

export async function moderatePhotoAction(_prev: FormState, form: FormData): Promise<FormState> {
  return moderation(form, async ({ id, email }) => updatePhoto(await supabaseForRequest(), id, (k) => form.get(k), email), 'Foto actualizada.', '/admin/fotos');
}

/* ---------- Menú (bloque 4d) ---------- */

const menuRevalidate = (id: string) => revalidatePath(`/admin/lugares/${id}/menu`);

export async function menuSaveCategory(_prev: FormState, form: FormData): Promise<FormState> {
  const categoryId = form.get('category_id') ? String(form.get('category_id')) : null;
  const r = await run(form, async ({ id, email, get }) => saveCategory(await supabaseForRequest(), id, categoryId, get, email));
  menuRevalidate(String(form.get('id')));
  return r;
}

export async function menuSaveItem(_prev: FormState, form: FormData): Promise<FormState> {
  const itemId = form.get('item_id') ? String(form.get('item_id')) : null;
  const r = await run(form, async ({ id, email, get }) => saveItem(await supabaseForRequest(), id, itemId, get, email));
  menuRevalidate(String(form.get('id')));
  return r;
}

export async function menuToggleItem(_prev: FormState, form: FormData): Promise<FormState> {
  const itemId = String(form.get('item_id') ?? '');
  const hide = form.get('hide') === 'si';
  const r = await run(form, async ({ id, email }) => (UUID.test(itemId) ? setItemHidden(await supabaseForRequest(), id, itemId, hide, email) : { ok: false, errors: { _: 'Artículo no válido.' } }));
  menuRevalidate(String(form.get('id')));
  return r;
}

export async function menuPublish(_prev: FormState, form: FormData): Promise<FormState> {
  const withdraw = form.get('menu_action') === 'retirar';
  const r = await run(form, async ({ id, email }) => (withdraw ? unpublishMenu(await supabaseForRequest(), id, email) : publishMenu(await supabaseForRequest(), id, email)), withdraw ? 'Menú retirado.' : 'Menú publicado.');
  menuRevalidate(String(form.get('id')));
  return r;
}

/* ---------- Importación CSV (bloque 4d) ---------- */

export interface ImportState { report?: ImportReport; csv?: string; error?: string; created?: number }

export async function previewCsv(_prev: ImportState, form: FormData): Promise<ImportState> {
  await requireAdmin('/admin/importar');
  const file = form.get('file');
  if (!(file instanceof File) || file.size === 0) return { error: 'Elige un archivo CSV.' };
  if (file.size > MAX_BYTES) return { error: 'El archivo pasa de 1 MB.' };
  const csv = await file.text();
  try {
    const report = await previewImport(await supabaseForRequest(), csv);
    return report.fatal ? { error: report.fatal } : { report, csv };
  } catch (e) {
    console.error('[importar]', e);
    return { error: 'No se ha podido revisar el archivo.' };
  }
}

export async function confirmImport(_prev: ImportState, form: FormData): Promise<ImportState> {
  const user = await requireAdmin('/admin/importar');
  const csv = String(form.get('csv') ?? '');
  if (!csv || csv.length > MAX_BYTES) return { error: 'Vuelve a subir el archivo.' };
  try {
    const { created, report } = await runImport(await supabaseForRequest(), csv, user.email ?? user.id);
    if (report.fatal) return { error: report.fatal };
    clearContentCache();
    revalidatePath('/admin/lugares');
    return { created, report };
  } catch (e) {
    console.error('[importar]', e);
    return { error: 'No se ha podido importar. No se ha dado por terminada: revisa la lista de lugares antes de repetir.' };
  }
}

/* ---------- Indexación (Fase 5) ---------- */

export async function recalculate(_prev: FormState, _form: FormData): Promise<FormState> {
  const user = await requireAdmin('/admin/indexacion');
  try {
    const r = await recomputeIndexable(await supabaseForRequest(), user.email ?? user.id);
    clearContentCache();
    revalidatePath('/admin/indexacion');
    return { ok: true, message: `${r.evaluated} textos evaluados, ${r.indexable} indexables, ${r.changed} cambios, ${r.duplicates} con texto muy parecido a otro.` };
  } catch (e) {
    console.error('[indexable]', e);
    return { errors: { _: 'No se ha podido recalcular.' } };
  }
}
