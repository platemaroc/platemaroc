import { headers } from 'next/headers';
import { LOCALES, localePath } from '../i18n/config.ts';
import { suggestLocale } from '../i18n/negotiate.ts';
import { getMessages } from '../i18n/messages.ts';
import { SITE_NAME } from '../../../seo/types.ts';
import styles from './page.module.css';

const LANGUAGE_NAMES = { es: 'Español', en: 'English', fr: 'Français' } as const;

/** "/": selector de idioma. Solo SUGIERE según Accept-Language; nunca redirige (maestro §13). */
export default async function LanguageChooser() {
  const suggested = suggestLocale((await headers()).get('accept-language'));
  return (
    <main className={styles.main}>
      <h1 className={styles.title}>{SITE_NAME}</h1>
      <ul className={styles.languages}>
        {LOCALES.map((locale) => (
          <li key={locale}>
            <a className={styles.language} href={localePath(locale, '')} hrefLang={locale} lang={locale}>
              <span>{LANGUAGE_NAMES[locale]}</span>
              {locale === suggested && <span className={styles.badge}>{getMessages(locale).suggested}</span>}
            </a>
          </li>
        ))}
      </ul>
    </main>
  );
}
