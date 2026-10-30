import { headers } from 'next/headers';
import type { Locale } from '../../shared/locales.ts';
import { sectionPath } from '../../shared/routes.ts';
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
          <nav className={styles.desktopNav} aria-label={t.primaryNav}>
            <ul>
              <li><a href={sectionPath(locale, 'lugares')}>{t.nav.places}</a></li>
              <li><a href={sectionPath(locale, 'platos-tipicos')}>{t.nav.dishes}</a></li>
              <li><a href={sectionPath(locale, 'guias-gastronomicas')}>{t.nav.guides}</a></li>
              <li><a href={sectionPath(locale, 'ciudades-y-barrios')}>{t.nav.cities}</a></li>
            </ul>
          </nav>
          <nav aria-label={t.languageLabel} data-nav="idiomas">
            <ul className={styles.languages}>
              <li><span aria-current="true" lang={locale}>{locale.toUpperCase()}</span></li>
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
