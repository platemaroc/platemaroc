import { LOCALES, localePath } from '../i18n/config.ts';
import styles from './page.module.css';

/** 404 neutro: no se sabe el idioma (p. ej. /ar), así que se ofrecen los tres. */
export default function NotFound() {
  return (
    <main className={styles.main}>
      <h1 className={styles.title}>404</h1>
      <ul className={styles.inline}>
        {LOCALES.map((l) => (
          <li key={l}>
            <a className={styles.language} href={localePath(l, '')} hrefLang={l} lang={l}>{l.toUpperCase()}</a>
          </li>
        ))}
      </ul>
    </main>
  );
}
