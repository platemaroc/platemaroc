import { notFound } from 'next/navigation';
import { isLocale, LOCALES, localePath } from '../../i18n/config.ts';
import { getMessages } from '../../i18n/messages.ts';
import { SITE_NAME } from '../../../../seo/types.ts';
import styles from '../page.module.css';

/** Portada provisional (Fase 1). Las plantillas reales llegan en la Fase 3. */
export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getMessages(locale);
  return (
    <main className={styles.main}>
      <h1 className={styles.title}>{SITE_NAME}</h1>
      <p className={styles.tagline}>{t.tagline}</p>
      <p>{t.comingSoon}</p>
      <nav aria-label={t.chooseLanguage}>
        <ul className={styles.inline}>
          {LOCALES.filter((l) => l !== locale).map((l) => (
            <li key={l}>
              <a className={styles.language} href={localePath(l, '')} hrefLang={l} lang={l}>{l.toUpperCase()}</a>
            </li>
          ))}
        </ul>
      </nav>
    </main>
  );
}
