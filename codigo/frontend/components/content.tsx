import type { ReactNode } from 'react';
import type { Locale } from '../../shared/locales.ts';
import { sectionPath } from '../../shared/routes.ts';
import { EmptyState, Photo, Stars } from '../../components-ui/mobile-design/ui.tsx';
import type { PlaceSummary } from '../../backend/content/index.ts';
import { getMessages, reviewLabel } from '../i18n/messages.ts';
import styles from './components.module.css';

export function Breadcrumbs({ items, label }: { items: { name: string; href?: string }[]; label: string }) {
  return (
    <nav className={styles.breadcrumbs} aria-label={label}>
      <ol>
        {items.map((item, i) => (
          <li key={i}>{item.href ? <a href={item.href}>{item.name}</a> : <span aria-current="page">{item.name}</span>}</li>
        ))}
      </ol>
    </nav>
  );
}

export function PlaceCard({ place, locale, heading: H = 'h3' }: { place: PlaceSummary; locale: Locale; heading?: 'h2' | 'h3' }) {
  const t = getMessages(locale);
  const where = [place.neighborhood?.name, place.city?.name].filter(Boolean).join(', ');
  return (
    <a className={`${styles.card} ${styles.placeCard}`} href={sectionPath(locale, place.section, place.slug)}>
      <Photo src={place.photo?.src} alt={place.photo?.alt} emptyLabel={t.noPhoto} />
      <div className={styles.cardBody}>
        <H className={styles.cardTitle}>{place.name}</H>
        <p className={styles.cardMeta}>
          {t.sections[place.section]}{where && ` · ${where}`}{place.priceRange ? ` · ${t.priceRange} ${'●'.repeat(place.priceRange)}${'○'.repeat(4 - place.priceRange)}` : ''}
        </p>
        <Stars locale={locale} average={place.rating.average} count={place.rating.count} label={reviewLabel(t, place.rating.count)} emptyLabel={t.noReviews} />
        {place.summary && <p className={styles.cardSummary}>{place.summary}</p>}
      </div>
    </a>
  );
}

export function PlaceList({ places, locale, heading }: { places: PlaceSummary[]; locale: Locale; heading?: 'h2' | 'h3' }) {
  if (!places.length) return <EmptyState>{getMessages(locale).empty}</EmptyState>;
  return (
    <ul className={styles.cards}>
      {places.map((p) => <li key={`${p.section}/${p.slug}`}><PlaceCard place={p} locale={locale} heading={heading} /></li>)}
    </ul>
  );
}

/** Lista simple de enlaces (platos, guías, ciudades, barrios). */
export function LinkList({ items, empty, heading: H = 'h3' }: { items: { href: string; name: string; summary?: string | null }[]; empty: ReactNode; heading?: 'h2' | 'h3' }) {
  if (!items.length) return <EmptyState>{empty}</EmptyState>;
  return (
    <ul className={styles.cards}>
      {items.map((x) => (
        <li key={x.href}>
          <a className={styles.card} href={x.href}>
            <H className={styles.cardTitle}>{x.name}</H>
            {x.summary && <p className={styles.cardSummary}>{x.summary}</p>}
          </a>
        </li>
      ))}
    </ul>
  );
}

export function DemoBanner({ locale }: { locale: Locale }) {
  return <p className={styles.demo} role="note">{getMessages(locale).demoNotice}</p>;
}
