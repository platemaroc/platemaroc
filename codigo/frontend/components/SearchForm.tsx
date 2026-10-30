import type { Locale } from '../../shared/locales.ts';
import { sectionPath, type PlaceSection } from '../../shared/routes.ts';
import { MAX_SEARCH_LENGTH } from '../../shared/search.ts';
import { getMessages } from '../i18n/messages.ts';
import styles from './components.module.css';

/**
 * Formulario GET: funciona sin JavaScript y el resultado es una URL que se puede compartir.
 * `compact`: la portada, solo con el texto. Sin `cities`, tampoco hay filtro por ciudad.
 */
export function SearchForm({ locale, section = 'lugares', q = '', city = '', cities, compact = false }: {
  locale: Locale; section?: PlaceSection | 'lugares'; q?: string; city?: string; cities?: { slug: string; name: string }[]; compact?: boolean;
}) {
  const t = getMessages(locale).searchForm;
  const action = sectionPath(locale, section);
  return (
    <form role="search" action={action} className={compact ? styles.searchCompact : styles.search}>
      <label className={compact ? styles.searchLabelHidden : styles.searchLabel}>
        <span>{t.label}</span>
        <input type="search" name="q" defaultValue={q} maxLength={MAX_SEARCH_LENGTH} placeholder={t.placeholder} enterKeyHint="search" />
      </label>
      {!!cities?.length && (
        <label className={styles.searchLabel}>
          <span>{t.city}</span>
          <select name="ciudad" defaultValue={city}>
            <option value="">{t.allCities}</option>
            {cities.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
          </select>
        </label>
      )}
      <button type="submit">{t.submit}</button>
      {(q || city) && <a className={styles.searchClear} href={action}>{t.clear}</a>}
    </form>
  );
}
