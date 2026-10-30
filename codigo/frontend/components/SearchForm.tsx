import type { Locale } from '../../shared/locales.ts';
import { MIN_RATINGS, PRICE_LEVELS, hasFilters, type PlaceFilters } from '../../shared/place-filters.ts';
import { PLACE_SECTIONS, sectionPath, type PlaceSection } from '../../shared/routes.ts';
import { MAX_SEARCH_LENGTH } from '../../shared/search.ts';
import { getMessages } from '../i18n/messages.ts';
import styles from './components.module.css';

interface Option { slug: string; name: string }

/**
 * Formulario GET: funciona sin JavaScript y el resultado es una URL que se puede compartir.
 * `compact`: la portada, solo con el texto. Con `filters`, además la búsqueda avanzada, plegada si no hay nada elegido.
 * El barrio se elige tras buscar por una ciudad: sin JavaScript, la lista no puede cambiar al vuelo.
 */
export function SearchForm({ locale, section = 'lugares', q = '', city = '', cities, neighborhoods = [], filters, compact = false }: {
  locale: Locale; section?: PlaceSection | 'lugares'; q?: string; city?: string; cities?: Option[]; neighborhoods?: Option[]; filters?: PlaceFilters; compact?: boolean;
}) {
  const messages = getMessages(locale);
  const t = messages.searchForm;
  const action = sectionPath(locale, section);
  const advanced = !!filters && hasFilters(filters);
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
      {filters && (
        <details className={styles.searchMore} open={advanced}>
          <summary>{t.more}</summary>
          <div className={styles.searchFields}>
            {section === 'lugares' && (
              <label className={styles.searchLabel}>
                <span>{t.type}</span>
                <select name="tipo" defaultValue={filters.section ?? ''}>
                  <option value="">{t.allTypes}</option>
                  {PLACE_SECTIONS.map((s) => <option key={s} value={s}>{messages.sections[s]}</option>)}
                </select>
              </label>
            )}
            {neighborhoods.length > 0 && (
              <label className={styles.searchLabel}>
                <span>{t.neighborhood}</span>
                <select name="barrio" defaultValue={filters.neighborhood}>
                  <option value="">{t.allNeighborhoods}</option>
                  {neighborhoods.map((n) => <option key={n.slug} value={n.slug}>{n.name}</option>)}
                </select>
              </label>
            )}
            <label className={styles.searchLabel}>
              <span>{messages.priceRange}</span>
              <select name="precio" defaultValue={filters.price ?? ''}>
                <option value="">{t.anyPrice}</option>
                {PRICE_LEVELS.map((p) => <option key={p} value={p}>{'●'.repeat(p)}{'○'.repeat(4 - p)}</option>)}
              </select>
            </label>
            <label className={styles.searchLabel}>
              <span>{t.rating}</span>
              <select name="valoracion" defaultValue={filters.minRating ?? ''}>
                <option value="">{t.anyRating}</option>
                {MIN_RATINGS.map((r) => <option key={r} value={r}>{t.ratingFrom.replace('{n}', r.toLocaleString(locale))}</option>)}
              </select>
            </label>
            <label className={styles.searchLabel}>
              <span>{t.sort}</span>
              <select name="orden" defaultValue={filters.sort}>
                <option value="nombre">{t.sortName}</option>
                <option value="valoracion">{t.sortRating}</option>
              </select>
            </label>
          </div>
        </details>
      )}
      <button type="submit">{t.submit}</button>
      {(q || city || advanced) && <a className={styles.searchClear} href={action}>{t.clear}</a>}
    </form>
  );
}
