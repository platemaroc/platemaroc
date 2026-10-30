'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { allow, LIMITS } from '../../../backend/auth/rate-limit.ts';
import { clearContentCache } from '../../../backend/content/cache.ts';
import { isPlaceSection, sectionPath, type PlaceSection } from '../../../shared/routes.ts';
import { DEFAULT_LOCALE, isLocale, type Locale } from '../../i18n/config.ts';
import { getMessages } from '../../i18n/messages.ts';
import { deleteAccount } from '../../../backend/reviews/account.ts';
import { deleteOwnReview, reviewContext, setDisplayName, submitReview } from '../../../backend/reviews/user-reviews.ts';
import { MAX_REVIEW_PHOTOS } from '../../../backend/reviews/validate.ts';
import { currentUser, supabaseForRequest } from '../../lib/supabase-server.ts';

export interface UserFormState { ok?: boolean; message?: string; error?: string }

const locale = (form: FormData): Locale => { const l = form.get('lang'); return isLocale(l) ? l : DEFAULT_LOCALE; };

/** Cada acción vuelve a comprobar la sesión: se pueden invocar sin pasar por la página. */
async function requireUser(next: string) {
  const user = await currentUser();
  if (!user) redirect(`/auth/entrar?next=${encodeURIComponent(next)}`);
  return user;
}

export async function saveName(_prev: UserFormState, form: FormData): Promise<UserFormState> {
  const user = await requireUser('/cuenta');
  const t = getMessages(locale(form)).account;
  if (!allow(`form:${user.id}`, LIMITS.form)) return { error: t.nameInvalid };
  if (!(await setDisplayName(await supabaseForRequest(), user.id, form.get('display_name')))) return { error: t.nameInvalid };
  revalidatePath('/cuenta');
  return { ok: true, message: t.saved };
}

export async function sendReview(_prev: UserFormState, form: FormData): Promise<UserFormState> {
  const section = String(form.get('section') ?? '');
  const slug = String(form.get('slug') ?? '');
  const l = locale(form);
  const user = await requireUser(`/cuenta/resena/${section}/${slug}?lang=${l}`);
  const t = getMessages(l).form;
  if (!allow(`form:${user.id}`, LIMITS.form)) return { error: t.err.generic };
  if (!isPlaceSection(section as PlaceSection)) return { error: t.err.place };
  const files = form.getAll('photos').filter((f): f is File => f instanceof File);
  if (files.filter((f) => f.size > 0).length > MAX_REVIEW_PHOTOS) return { error: t.err.photos_limit };
  const db = await supabaseForRequest();
  try {
    const ctx = await reviewContext(db, user.id, section, slug);
    if (!ctx) return { error: t.err.place };
    const code = await submitReview(db, user.id, ctx.placeId, (k) => form.get(k), files);
    if (code !== 'ok') return { error: t.err[code] };
  } catch (e) {
    console.error('[reseña]', e);
    return { error: t.err.generic };
  }
  clearContentCache();
  revalidatePath('/cuenta');
  revalidatePath(sectionPath(l, section as PlaceSection, slug));
  return { ok: true, message: t.sent };
}

export async function removeReview(form: FormData): Promise<void> {
  const user = await requireUser('/cuenta');
  const id = String(form.get('id') ?? '');
  if (/^[0-9a-f-]{36}$/.test(id)) await deleteOwnReview(await supabaseForRequest(), user.id, id);
  clearContentCache();
  revalidatePath('/cuenta');
}

/** Eliminar la cuenta: hay que escribir el propio email para confirmar. */
export async function removeAccount(_prev: UserFormState, form: FormData): Promise<UserFormState> {
  const user = await requireUser('/cuenta');
  const t = getMessages(locale(form)).account;
  if (String(form.get('confirm') ?? '').trim().toLowerCase() !== (user.email ?? '').toLowerCase()) return { error: t.deleteWrong };
  if (user.isAdmin) return { error: t.deleteAdmin };
  const db = await supabaseForRequest();
  if (!(await deleteAccount(db, user))) return { error: getMessages(locale(form)).form.err.generic };
  await db.auth.signOut();
  clearContentCache();
  redirect(`/${locale(form)}`);
}
