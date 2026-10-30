import type { Locale } from '../../shared/locales.ts';
import { SITE_NAME } from '../../../seo/types.ts';
import { getMessages } from '../i18n/messages.ts';
import styles from './components.module.css';

/** Pie de las páginas públicas. "Entrar" lleva a la cuenta: quien no tiene sesión pasa por la pantalla de acceso. */
export function SiteFooter({ locale }: { locale: Locale }) {
  const t = getMessages(locale);
  return (
    <footer className={styles.footer}>
      <nav aria-label={t.footerNav}>
        <ul>
          <li><a href={`/privacidad?lang=${locale}`}>{t.privacy.title}</a></li>
          <li><a href={`/cuenta?lang=${locale}`}>{t.auth.title}</a></li>
        </ul>
      </nav>
      <p>© {new Date().getFullYear()} {SITE_NAME}</p>
    </footer>
  );
}
