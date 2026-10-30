import { headers } from 'next/headers';
import type { Locale } from '../../shared/locales.ts';
import { languageLinks } from '../i18n/alternates.ts';
import { getMessages } from '../i18n/messages.ts';
import { Brand } from './Brand.tsx';
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
          <Brand href={`/${locale}`} />
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
