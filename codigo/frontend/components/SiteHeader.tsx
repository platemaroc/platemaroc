import { headers } from 'next/headers';
import type { Locale } from '../../shared/locales.ts';
import { SITE_NAME } from '../../../seo/types.ts';
import { languageLinks } from '../i18n/alternates.ts';
import { getMessages } from '../i18n/messages.ts';
import styles from './components.module.css';

/**
 * Cabecera de cada página. `available` = idiomas en que la página está publicada: para el resto, el selector
 * lleva a la portada de ese idioma (nunca a una página que daría 404).
 */
export async function SiteHeader({ locale, available }: { locale: Locale; available?: readonly Locale[] }) {
  const pathname = (await headers()).get('x-pathname') ?? `/${locale}`;
  const t = getMessages(locale);
  return (
    <>
      <a className={styles.skip} href="#contenido">{t.skipToContent}</a>
      <header className={styles.headerBar}>
        <div className={styles.header}>
          <a className={styles.brand} href={`/${locale}`}>
            {/* Logo: un plato visto desde arriba con la estrella de los azulejos marroquíes. */}
            <svg className={styles.logo} viewBox="0 0 64 64" aria-hidden="true">
              <circle cx="32" cy="32" r="26" fill="none" stroke="currentColor" strokeWidth="3.5" />
              <path fill="currentColor" d="M32 15l5 7h8l1 8 6 2-6 2-1 8h-8l-5 7-5-7h-8l-1-8-6-2 6-2 1-8h8z" />
            </svg>
            {SITE_NAME}
          </a>
          <nav aria-label={t.languageLabel}>
            <ul className={styles.languages}>
              {languageLinks(pathname, locale, available).map(({ locale: l, href }) => (
                <li key={l}><a href={href} hrefLang={l} lang={l}>{l.toUpperCase()}</a></li>
              ))}
            </ul>
          </nav>
        </div>
      </header>
    </>
  );
}
