import type { Locale } from '../../shared/locales.ts';
import { sectionPath } from '../../shared/routes.ts';
import { SITE_NAME } from '../../../seo/types.ts';
import { INFO_PAGES, type InfoSlug } from '../i18n/info-pages.ts';
import { getMessages } from '../i18n/messages.ts';
import { Brand } from './Brand.tsx';
import styles from './components.module.css';

const ABOUT: InfoSlug[] = ['sobre-nosotros', 'contacto', 'como-funcionan-las-resenas'];
const LEGAL: InfoSlug[] = ['privacidad', 'cookies', 'aviso-legal', 'condiciones'];

/** Pie de las páginas públicas. "Entrar" lleva a la cuenta: quien no tiene sesión pasa por la pantalla de acceso. */
export function SiteFooter({ locale }: { locale: Locale }) {
  const t = getMessages(locale);
  const info = (slug: InfoSlug) => <li key={slug}><a href={`/${locale}/info/${slug}`}>{INFO_PAGES[slug][locale].title}</a></li>;
  return (
    <footer className={styles.footerBar}>
      <div className={styles.footer}>
        <div className={styles.footerBrand}>
          <Brand href={`/${locale}`} />
          <p>{t.tagline}</p>
        </div>
        <nav aria-label={t.footerExplore}>
          <h2>{t.footerExplore}</h2>
          <ul>
            <li><a href={sectionPath(locale, 'lugares')}>{t.nav.places}</a></li>
            <li><a href={sectionPath(locale, 'platos-tipicos')}>{t.nav.dishes}</a></li>
            <li><a href={sectionPath(locale, 'guias-gastronomicas')}>{t.nav.guides}</a></li>
            <li><a href={sectionPath(locale, 'ciudades-y-barrios')}>{t.nav.cities}</a></li>
          </ul>
        </nav>
        <nav aria-label={SITE_NAME}>
          <h2>{SITE_NAME}</h2>
          <ul>
            {ABOUT.map(info)}
            <li><a href={`/cuenta?lang=${locale}`}>{t.auth.title}</a></li>
          </ul>
        </nav>
        <nav aria-label={t.footerLegal}>
          <h2>{t.footerLegal}</h2>
          <ul>{LEGAL.map(info)}</ul>
        </nav>
        <p className={styles.footerCopy}>© {new Date().getFullYear()} {SITE_NAME}</p>
      </div>
    </footer>
  );
}
