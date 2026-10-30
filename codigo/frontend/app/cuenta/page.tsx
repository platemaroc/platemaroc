import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { isPlaceSection, sectionPath, type PlaceSection } from '../../../shared/routes.ts';
import { getProfile, listOwnReviews } from '../../../backend/reviews/user-reviews.ts';
import { DEFAULT_LOCALE, isLocale, type Locale } from '../../i18n/config.ts';
import { getMessages } from '../../i18n/messages.ts';
import { suggestLocale } from '../../i18n/negotiate.ts';
import { currentUser, supabaseForRequest } from '../../lib/supabase-server.ts';
import { signOut } from '../auth/actions.ts';
import { UserForm } from './UserForm.tsx';
import { removeReview, saveName } from './actions.ts';
import styles from './cuenta.module.css';

export const metadata: Metadata = { title: 'Mi cuenta', robots: { index: false, follow: false } };

/** /cuenta?lang=es — nombre visible y reseñas propias con su estado. */
export default async function Account({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const { lang } = await searchParams;
  const locale: Locale = isLocale(lang) ? lang : (suggestLocale((await headers()).get('accept-language')) ?? DEFAULT_LOCALE);
  const user = await currentUser();
  if (!user) redirect(`/auth/entrar?next=${encodeURIComponent(`/cuenta?lang=${locale}`)}&lang=${locale}`);
  const db = await supabaseForRequest();
  const [profile, reviews] = await Promise.all([getProfile(db, user.id), listOwnReviews(db, user.id)]);
  const t = getMessages(locale);
  const a = t.account;
  const label = { pendiente: a.pendiente, aprobada: a.aprobada, rechazada: a.rechazada } as Record<string, string>;
  return (
    <main className={styles.main} lang={locale}>
      <div className={styles.top}>
        <a href={`/${locale}`}>← {t.nav.home}</a>
        <form action={signOut}><button type="submit" className={styles.secondary}>{t.auth.signOut}</button></form>
      </div>
      <h1 className={styles.title}>{a.title}</h1>
      <UserForm action={saveName} hidden={{ lang: locale }} submit={a.saveName} sending="…">
        <label className={styles.field}>{a.name}
          <input name="display_name" defaultValue={profile.display_name ?? ''} maxLength={40} autoComplete="nickname" />
          <small>{a.nameHint}</small>
        </label>
      </UserForm>

      <section className={styles.section}>
        <h2>{a.myReviews}</h2>
        {reviews.length === 0 ? <p className={styles.muted}>{a.none}</p> : (
          <ul className={styles.list}>
            {reviews.map((r) => {
              const section = r.places?.place_types?.slug as PlaceSection | undefined;
              const slug = r.places?.slug as string | undefined;
              return (
                <li key={r.id}>
                  <strong>{r.titles[locale] ?? r.titles.es ?? slug}</strong>
                  <span aria-label={`${r.rating}/5`}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)} · {label[r.status] ?? r.status}</span>
                  {r.comment && <span>{r.comment}</span>}
                  {r.status === 'rechazada' && r.rejection_reason && <span className={styles.muted}>{a.reason}: {r.rejection_reason}</span>}
                  <div className={styles.actions}>
                    {section && slug && isPlaceSection(section) && <a className={styles.link} href={`/cuenta/resena/${section}/${slug}?lang=${locale}`}>{a.edit}</a>}
                    {section && slug && isPlaceSection(section) && r.status === 'aprobada' && <a className={styles.link} href={sectionPath(locale, section, slug)}>↗</a>}
                    <form action={removeReview}>
                      <input type="hidden" name="id" value={r.id} />
                      <button type="submit" className={styles.secondary}>{a.remove}</button>
                    </form>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}
