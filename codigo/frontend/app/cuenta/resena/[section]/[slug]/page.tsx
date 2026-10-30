import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { isPlaceSection, sectionPath, type PlaceSection } from '../../../../../../shared/routes.ts';
import { MAX_COMMENT } from '../../../../../../backend/reviews/validate.ts';
import { getProfile, reviewContext } from '../../../../../../backend/reviews/user-reviews.ts';
import { DEFAULT_LOCALE, isLocale, type Locale } from '../../../../../i18n/config.ts';
import { getMessages } from '../../../../../i18n/messages.ts';
import { suggestLocale } from '../../../../../i18n/negotiate.ts';
import { currentUser, supabaseForRequest } from '../../../../../lib/supabase-server.ts';
import { UserForm } from '../../../UserForm.tsx';
import { sendReview } from '../../../actions.ts';
import styles from '../../../cuenta.module.css';

export const metadata: Metadata = { title: 'Reseña', robots: { index: false, follow: false } };

type Props = { params: Promise<{ section: string; slug: string }>; searchParams: Promise<Record<string, string | undefined>> };

/** /cuenta/resena/{tipo}/{slug}?lang=es — crear o editar la reseña propia. Es zona privada: la ficha pública no consulta la sesión. */
export default async function ReviewPage({ params, searchParams }: Props) {
  const { section, slug } = await params;
  const { lang } = await searchParams;
  if (!isPlaceSection(section as PlaceSection)) notFound();
  const locale: Locale = isLocale(lang) ? lang : (suggestLocale((await headers()).get('accept-language')) ?? DEFAULT_LOCALE);
  const self = `/cuenta/resena/${section}/${slug}?lang=${locale}`;
  const user = await currentUser();
  if (!user) redirect(`/auth/entrar?next=${encodeURIComponent(self)}&lang=${locale}`);
  const db = await supabaseForRequest();
  const ctx = await reviewContext(db, user.id, section, slug);
  if (!ctx) notFound();
  const t = getMessages(locale);
  const f = t.form;
  const { display_name: name } = await getProfile(db, user.id);
  const place = ctx.titles[locale] ?? ctx.titles.es ?? slug;
  return (
    <main className={styles.main} lang={locale}>
      <div className={styles.top}>
        <a href={sectionPath(locale, section as PlaceSection, slug)}>← {place}</a>
        <a href={`/cuenta?lang=${locale}`}>{t.myAccount}</a>
      </div>
      <h1 className={styles.title}>{f.title}: {place}</h1>
      {ctx.own && <p className={styles.muted}>{f.editing}</p>}
      {!name && <p role="alert" className={styles.error}>{f.err.name} <a href={`/cuenta?lang=${locale}`}>{t.myAccount}</a></p>}
      <UserForm action={sendReview} hidden={{ lang: locale, section, slug }} submit={f.send} sending="…">
        <fieldset className={styles.stars}>
          <legend>{f.rating}</legend>
          {[1, 2, 3, 4, 5].map((n) => (
            <label key={n}><input type="radio" name="rating" value={n} defaultChecked={ctx.own?.rating === n} /> {n} ★</label>
          ))}
        </fieldset>
        <label className={styles.field}>{f.comment}
          <textarea name="comment" rows={6} maxLength={MAX_COMMENT} defaultValue={ctx.own?.comment ?? ''} />
        </label>
        <label className={styles.field}>{f.visited}
          <input type="date" name="visited_on" defaultValue={ctx.own?.visited_on ?? ''} />
        </label>
        <label className={styles.field}>{f.photos}
          <input type="file" name="photos" accept="image/*" multiple />
        </label>
        <label className={styles.check}><input type="checkbox" name="consent" /> <span>{f.consent} <a href={`/privacidad?lang=${locale}`} target="_blank" rel="noopener">{f.privacy}</a></span></label>
        <label className={styles.check}><input type="checkbox" name="photo_consent" /> <span>{f.photoConsent}</span></label>
      </UserForm>
    </main>
  );
}
