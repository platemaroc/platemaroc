import { Fragment } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { Locale } from '../../../../../shared/locales.ts';
import { isPlaceSection, MENU_SEGMENT, sectionPath, type Section } from '../../../../../shared/routes.ts';
import { ButtonLink, Photo, Stars } from '../../../../../components-ui/mobile-design/ui.tsx';
import { getMessages, reviewLabel, type Messages } from '../../../../i18n/messages.ts';
import { SiteHeader } from '../../../../components/SiteHeader.tsx';
import { Breadcrumbs, LinkList, PlaceList } from '../../../../components/content.tsx';
import { PlaceMap } from '../../../../maps/PlaceMap.tsx';
import { getCity, getDish, getGuide, getPlace, resolveRoute } from '../../../../lib/data.ts';
import styles from '../../templates.module.css';

type Params = Promise<{ locale: string; section: string; slug: string }>;

async function load(params: Params) {
  const { locale, section } = await resolveRoute(params);
  const { slug } = await params;
  if (isPlaceSection(section!)) return { locale, section: section!, kind: 'place' as const, data: await getPlace(locale, section, slug) };
  if (section === 'platos-tipicos') return { locale, section, kind: 'dish' as const, data: await getDish(locale, slug) };
  if (section === 'guias-gastronomicas') return { locale, section, kind: 'guide' as const, data: await getGuide(locale, slug) };
  if (section === 'ciudades-y-barrios') return { locale, section, kind: 'city' as const, data: await getCity(locale, slug) };
  notFound();
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { data } = await load(params);
  return data ? { title: data.name, description: data.summary ?? undefined } : {};
}

const paragraphs = (text: string | null) => (text ?? '').split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);

function Prose({ text }: { text: string | null }) {
  const ps = paragraphs(text);
  return ps.length ? <div className={styles.prose}>{ps.map((p, i) => <p key={i}>{p}</p>)}</div> : null;
}

function crumbs(t: Messages, locale: Locale, section: Section, name: string) {
  return [{ name: t.nav.home, href: `/${locale}` }, { name: t.sections[section], href: sectionPath(locale, section) }, { name }];
}

/** Ficha de lugar, plato, guía o ciudad. */
export default async function Detail({ params }: { params: Params }) {
  const page = await load(params);
  if (!page.data) notFound();
  const { locale, section } = page;
  const t = getMessages(locale);

  let body;
  if (page.kind === 'place') {
    const p = page.data;
    body = (
      <>
        <p className={styles.lead}>
          {t.sections[p.section]}{p.neighborhood || p.city ? ` · ${[p.neighborhood?.name, p.city?.name].filter(Boolean).join(', ')}` : ''}
        </p>
        <Stars locale={locale} average={p.rating.average} count={p.rating.count} label={reviewLabel(t, p.rating.count)} emptyLabel={t.noReviews} />
        <div className={styles.gallery}>
          {(p.photos.length ? p.photos : [null]).slice(0, 3).map((ph, i) => (
            <Photo key={i} src={ph?.src} alt={ph?.alt} emptyLabel={t.noPhoto} priority={i === 0} />
          ))}
        </div>
        {p.summary && <p>{p.summary}</p>}
        <Prose text={p.content} />
        {p.hasMenu && <p><ButtonLink href={sectionPath(locale, p.section, p.slug, MENU_SEGMENT)}>{t.seeMenu}</ButtonLink></p>}
        {(p.openingHours.length > 0 || p.phone || p.website || p.priceRange) && (
          <dl className={styles.facts}>
            {p.priceRange && <><dt>{t.priceRange}</dt><dd aria-label={`${p.priceRange}/4`}>{'●'.repeat(p.priceRange)}{'○'.repeat(4 - p.priceRange)}</dd></>}
            {p.openingHours.map(([day, hours], i) => (
              <Fragment key={i}><dt>{i === 0 ? t.openingHours : ''}</dt><dd>{day ? `${day}: ` : ''}{hours}</dd></Fragment>
            ))}
            {p.phone && <><dt>{t.phone}</dt><dd><a href={`tel:${p.phone.replace(/\s+/g, '')}`}>{p.phone}</a></dd></>}
            {p.website && <><dt>{t.website}</dt><dd><a href={p.website} rel="noopener" target="_blank">{p.website.replace(/^https?:\/\//, '')}</a></dd></>}
          </dl>
        )}
        {p.dishes.length > 0 && (
          <section className={styles.section}>
            <h2>{t.relatedDishes}</h2>
            <ul className={styles.chips}>{p.dishes.map((d) => <li key={d.slug}><a href={sectionPath(locale, 'platos-tipicos', d.slug)}>{d.name}</a></li>)}</ul>
          </section>
        )}
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
        <section className={styles.section} aria-labelledby="ubicacion">
          <h2 id="ubicacion">{t.location}</h2>
          <PlaceMap name={p.name} lat={p.lat} lng={p.lng} address={p.address ?? undefined} directionsText={p.directions ?? undefined}
            staticMapSrc={p.staticMapSrc ?? undefined} locale={locale} />
        </section>
      </>
    );
  } else if (page.kind === 'dish') {
    const d = page.data;
    body = (
      <>
        {d.summary && <p className={styles.lead}>{d.summary}</p>}
        <Prose text={d.content} />
        {d.ingredients.length > 0 && (
          <dl className={styles.facts}>
            {d.ingredients.length > 0 && <><dt>{t.ingredients}</dt><dd>{d.ingredients.join(', ')}</dd></>}
          </dl>
        )}
        <section className={styles.section}><h2>{t.whereToTry}</h2><PlaceList places={d.places} locale={locale} /></section>
      </>
    );
  } else if (page.kind === 'guide') {
    const g = page.data;
    body = (
      <>
        {g.summary && <p className={styles.lead}>{g.summary}</p>}
        {g.author && <p><strong>{t.author}:</strong> {g.author}</p>}
        <Prose text={g.content} />
        <section className={styles.section}><h2>{t.relatedPlaces}</h2><PlaceList places={g.places} locale={locale} /></section>
        {g.dishes.length > 0 && (
          <section className={styles.section}>
            <h2>{t.relatedDishes}</h2>
            <ul className={styles.chips}>{g.dishes.map((d) => <li key={d.slug}><a href={sectionPath(locale, 'platos-tipicos', d.slug)}>{d.name}</a></li>)}</ul>
          </section>
        )}
        {(g.cities.length > 0 || g.neighborhoods.length > 0) && (
          <section className={styles.section}>
            <h2>{t.sections['ciudades-y-barrios']}</h2>
            <ul className={styles.chips}>
              {g.cities.map((c) => <li key={c.slug}><a href={sectionPath(locale, 'ciudades-y-barrios', c.slug)}>{c.name}</a></li>)}
              {g.neighborhoods.map((n) => <li key={`${n.city}/${n.slug}`}><a href={sectionPath(locale, 'ciudades-y-barrios', n.city, n.slug)}>{n.name}</a></li>)}
            </ul>
          </section>
        )}
      </>
    );
  } else {
    const c = page.data;
    body = (
      <>
        {c.summary && <p className={styles.lead}>{c.summary}</p>}
        <Prose text={c.content} />
        {c.neighborhoods.length > 0 && (
          <section className={styles.section}>
            <h2>{t.neighborhoods}</h2>
            <LinkList empty={t.empty} items={c.neighborhoods.map((n) => ({ href: sectionPath(locale, 'ciudades-y-barrios', c.slug, n.slug), name: n.name }))} />
          </section>
        )}
        <section className={styles.section}><h2>{t.placesHere}</h2><PlaceList places={c.places} locale={locale} /></section>
      </>
    );
  }

  return (
    <>
      <SiteHeader locale={locale} available={page.data.locales} />
      <main id="contenido" className={styles.main}>
        <Breadcrumbs label={t.breadcrumb} items={crumbs(t, locale, section as Section, page.data.name)} />
        <h1 className={styles.title}>{page.data.name}</h1>
        {body}
      </main>
    </>
  );
}
