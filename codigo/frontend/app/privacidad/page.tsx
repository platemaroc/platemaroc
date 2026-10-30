import type { Metadata } from 'next';
import { DEFAULT_LOCALE, isLocale } from '../../i18n/config.ts';
import { getMessages } from '../../i18n/messages.ts';
import { CONSENT_VERSION } from '../../../backend/reviews/validate.ts';
import styles from '../cuenta/cuenta.module.css';

export const metadata: Metadata = { title: 'Privacidad', robots: { index: false, follow: false } };

/** BORRADOR. El texto legal lo aporta el titular o su asesor (maestro §10): no se inventa. Sin él, el alta pública no se abre en producción. */
export default async function Privacy({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const { lang } = await searchParams;
  const locale = isLocale(lang) ? lang : DEFAULT_LOCALE;
  const t = getMessages(locale).privacy;
  return (
    <main className={styles.main} lang={locale}>
      <h1 className={styles.title}>{t.title}</h1>
      <p role="note" className={styles.error}>{t.draft}</p>
      <p className={styles.muted}>{CONSENT_VERSION}</p>
    </main>
  );
}
