'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { isLocale } from '../../i18n/config.ts';
import { isAdminEntity, type AdminEntity } from '../../../backend/admin-moderation/entities.ts';
import { changeStatus, changeTranslationStatus, saveFields, saveRelations, saveTranslation, type SaveResult } from '../../../backend/admin-moderation/content-admin.ts';
import { setStaticMap, updatePhoto, uploadPlacePhoto } from '../../../backend/admin-moderation/photos-admin.ts';
import { requireAdmin } from '../../lib/admin.ts';
import { supabaseForRequest } from '../../lib/supabase-server.ts';

/** Estado que devuelven los formularios del panel. */
export interface FormState { ok?: boolean; message?: string; errors?: Record<string, string> }

const UUID = /^[0-9a-f-]{36}$/;

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
  return run(form, async ({ key, id, email, get }) => (key === 'lugares'
    ? uploadPlacePhoto(await supabaseForRequest(), id, get, email)
    : { ok: false, errors: { _: 'Solo los lugares tienen fotos por ahora.' } }), 'Foto subida.');
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
