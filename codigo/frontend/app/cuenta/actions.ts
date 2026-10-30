'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { isPlaceSection, sectionPath, type PlaceSection } from '../../../shared/routes.ts';
import { DEFAULT_LOCALE, isLocale, type Locale } from '../../i18n/config.ts';
import { getMessages } from '../../i18n/messages.ts';
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
  revalidatePath('/cuenta');
  revalidatePath(sectionPath(l, section as PlaceSection, slug));
  return { ok: true, message: t.sent };
}

export async function removeReview(form: FormData): Promise<void> {
  const user = await requireUser('/cuenta');
  const id = String(form.get('id') ?? '');
  if (/^[0-9a-f-]{36}$/.test(id)) await deleteOwnReview(await supabaseForRequest(), user.id, id);
  revalidatePath('/cuenta');
}
