import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { safeNextPath } from '../../../../backend/auth/session.ts';
import { DEFAULT_LOCALE, isLocale, type Locale } from '../../../i18n/config.ts';
import { suggestLocale } from '../../../i18n/negotiate.ts';
import { getMessages } from '../../../i18n/messages.ts';
import { SignInForm } from '../SignInForm.tsx';
import styles from '../auth.module.css';

export const metadata: Metadata = { title: 'Entrar', robots: { index: false, follow: false } };

/** /auth/entrar?next=/admin&lang=es — acceso sin contraseña: Google, Apple (si está activado) o enlace y código por email. */
export default async function SignIn({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const { next, lang, error } = await searchParams;
  const locale: Locale = isLocale(lang) ? lang : (suggestLocale((await headers()).get('accept-language')) ?? DEFAULT_LOCALE);
  const t = getMessages(locale).auth;
  const target = encodeURIComponent(safeNextPath(next));
  return (
    <main className={styles.main} lang={locale}>
      <h1 className={styles.title}>{t.title}</h1>
      <a className={styles.google} href={`/auth/google?next=${target}`}>{t.google}</a>
      {process.env.APPLE_LOGIN_ENABLED === '1' && <a className={styles.google} href={`/auth/apple?next=${target}`}>{t.apple}</a>}
      <SignInForm locale={locale} next={safeNextPath(next)} t={t} initialError={error === 'cerrado' ? t.signupClosed : error ? t.linkError : undefined} />
    </main>
  );
}
