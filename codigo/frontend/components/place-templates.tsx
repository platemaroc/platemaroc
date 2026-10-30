import { Fragment, type ComponentType } from 'react';
import type { PlaceDetail } from '../../backend/content/index.ts';
import type { Locale } from '../../shared/locales.ts';
import { MENU_SEGMENT, sectionPath, type PlaceSection } from '../../shared/routes.ts';
import { ButtonLink, Photo, Stars } from '../../components-ui/mobile-design/ui.tsx';
import { getMessages, reviewLabel } from '../i18n/messages.ts';
import { PlaceMap } from '../maps/PlaceMap.tsx';
import styles from '../app/[locale]/templates.module.css';

/**
 * Plantillas de ficha por tipo de lugar (decisión del titular, 30-10-2026). Comparten las mismas piezas y cambian qué va primero.
 * Para añadir una, por ejemplo la de teterías: una función más y su entrada en TEMPLATES. Sin entrada, se usa la general.
 */
interface Props { place: PlaceDetail; locale: Locale }

const paragraphs = (text: string | null) => (text ?? '').split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);

export function Prose({ text }: { text: string | null }) {
  const ps = paragraphs(text);
  return ps.length ? <div className={styles.prose}>{ps.map((p, i) => <p key={i}>{p}</p>)}</div> : null;
}

function Summary({ place: p, locale }: Props) {
  const t = getMessages(locale);
  return (
    <>
      <p className={styles.lead}>
        {t.sections[p.section]}
        {p.neighborhood && p.city && <> · <a href={sectionPath(locale, 'ciudades-y-barrios', p.city.slug, p.neighborhood.slug)}>{p.neighborhood.name}</a></>}
        {p.city && <> · <a href={sectionPath(locale, 'ciudades-y-barrios', p.city.slug)}>{p.city.name}</a></>}
      </p>
      <Stars locale={locale} average={p.rating.average} count={p.rating.count} label={reviewLabel(t, p.rating.count)} emptyLabel={t.noReviews} />
      <div className={styles.gallery}>
        {(p.photos.length ? p.photos : [null]).slice(0, 3).map((ph, i) => (
          <Photo key={i} src={ph?.src} alt={ph?.alt} emptyLabel={t.noPhoto} priority={i === 0} />
        ))}
      </div>
    </>
  );
}

function Story({ place: p }: { place: PlaceDetail }) {
  return (
    <>
      {p.summary && <p>{p.summary}</p>}
      <Prose text={p.content} />
    </>
  );
}

function MenuLink({ place: p, locale }: Props) {
  return p.hasMenu ? <p><ButtonLink href={sectionPath(locale, p.section, p.slug, MENU_SEGMENT)}>{getMessages(locale).seeMenu}</ButtonLink></p> : null;
}

function Facts({ place: p, locale }: Props) {
  const t = getMessages(locale);
  if (!p.openingHours.length && !p.phone && !p.website && !p.priceRange) return null;
  return (
    <dl className={styles.facts}>
      {p.priceRange && <><dt>{t.priceRange}</dt><dd aria-label={`${p.priceRange}/4`}>{'●'.repeat(p.priceRange)}{'○'.repeat(4 - p.priceRange)}</dd></>}
      {p.openingHours.map(([day, hours], i) => (
        <Fragment key={i}><dt>{i === 0 ? t.openingHours : ''}</dt><dd>{day ? `${day}: ` : ''}{hours}</dd></Fragment>
      ))}
      {p.phone && <><dt>{t.phone}</dt><dd><a href={`tel:${p.phone.replace(/\s+/g, '')}`}>{p.phone}</a></dd></>}
      {p.website && <><dt>{t.website}</dt><dd><a href={p.website} rel="noopener" target="_blank">{p.website.replace(/^https?:\/\//, '')}</a></dd></>}
    </dl>
  );
}

function Dishes({ place: p, locale }: Props) {
  const t = getMessages(locale);
  if (!p.dishes.length) return null;
  return (
    <section className={styles.section}>
      <h2>{t.relatedDishes}</h2>
      <ul className={styles.chips}>{p.dishes.map((d) => <li key={d.slug}><a href={sectionPath(locale, 'platos-tipicos', d.slug)}>{d.name}</a></li>)}</ul>
    </section>
  );
}

function Reviews({ place: p, locale }: Props) {
  const t = getMessages(locale);
  return (
    <section className={styles.section} aria-labelledby="resenas">
      <h2 id="resenas">{t.reviewsTitle}</h2>
      {p.reviews.length === 0 && <p>{t.noReviews}</p>}
      <ul className={styles.reviews}>
        {p.reviews.map((r, i) => (
          <li key={i}>
            <strong>{r.author}</strong>
            <span aria-label={`${r.rating}/5`} className={styles.reviewStars}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
            <small>
              {new Date(r.date).toLocaleDateString(locale)}
              {r.locale && r.locale !== locale ? ` · ${t.reviewIn} ${r.locale.toUpperCase()}` : ''}
            </small>
            {r.comment && <p lang={r.locale ?? undefined}>{r.comment}</p>}
            {r.photos.length > 0 && <div className={styles.reviewPhotos}>{r.photos.map((ph) => <Photo key={ph.src} src={ph.src} alt={ph.alt} emptyLabel="" />)}</div>}
          </li>
        ))}
      </ul>
      <p><ButtonLink href={`/cuenta/resena/${p.section}/${p.slug}?lang=${locale}`}>{t.writeReview}</ButtonLink></p>
    </section>
  );
}

function Location({ place: p, locale }: Props) {
  return (
    <section className={styles.section} aria-labelledby="ubicacion">
      <h2 id="ubicacion">{getMessages(locale).location}</h2>
      <PlaceMap name={p.name} lat={p.lat} lng={p.lng} address={p.address ?? undefined} directionsText={p.directions ?? undefined}
        staticMapSrc={p.staticMapSrc ?? undefined} locale={locale} />
    </section>
  );
}

/** Plantilla general: primero cuenta el lugar y después da los datos. */
function GeneralTemplate(props: Props) {
  return (
    <>
      <Summary {...props} />
      <Story place={props.place} />
      <MenuLink {...props} />
      <Facts {...props} />
      <Dishes {...props} />
      <Reviews {...props} />
      <Location {...props} />
    </>
  );
}

/** Restaurante: quien entra quiere decidir rápido, así que menú, precio, horario y teléfono van antes que el texto. */
function RestaurantTemplate(props: Props) {
  return (
    <>
      <Summary {...props} />
      <div className={styles.keyFacts} data-template="restaurante">
        <MenuLink {...props} />
        <Facts {...props} />
      </div>
      <Dishes {...props} />
      <Story place={props.place} />
      <Reviews {...props} />
      <Location {...props} />
    </>
  );
}

const TEMPLATES: Partial<Record<PlaceSection, ComponentType<Props>>> = { restaurantes: RestaurantTemplate };

export function PlaceBody(props: Props) {
  const Template = TEMPLATES[props.place.section] ?? GeneralTemplate;
  return <Template {...props} />;
}
