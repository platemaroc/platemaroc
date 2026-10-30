import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { safeNextPath } from '../../../../backend/auth/session.ts';
import { DEFAULT_LOCALE, isLocale, type Locale } from '../../../i18n/config.ts';
import { suggestLocale } from '../../../i18n/negotiate.ts';
import { getMessages } from '../../../i18n/messages.ts';
import styles from '../auth.module.css';

export const metadata: Metadata = { title: 'Entrar', robots: { index: false, follow: false } };

/** /auth/entrar?next=/admin&lang=es — acceso con Google, sin contraseñas ni emails (decisión del titular, 30-10-2026). */
export default async function SignIn({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const { next, lang, error } = await searchParams;
  const locale: Locale = isLocale(lang) ? lang : (suggestLocale((await headers()).get('accept-language')) ?? DEFAULT_LOCALE);
  const t = getMessages(locale).auth;
  return (
    <main className={styles.main} lang={locale}>
      <h1 className={styles.title}>{t.title}</h1>
      <a className={styles.google} href={`/auth/google?next=${encodeURIComponent(safeNextPath(next))}`}>{t.google}</a>
      {error && <p role="alert" className={styles.error}>{error === 'cerrado' ? t.signupClosed : t.linkError}</p>}
    </main>
  );
}
