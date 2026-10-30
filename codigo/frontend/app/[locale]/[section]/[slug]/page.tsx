import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { Locale } from '../../../../../shared/locales.ts';
import type { PhotoView } from '../../../../../backend/content/index.ts';
import { cityTypePath, isPlaceSection, MENU_SEGMENT, PLACE_SECTIONS, sectionPath, type PlaceSection, type Section } from '../../../../../shared/routes.ts';
import { Photo } from '../../../../../components-ui/mobile-design/ui.tsx';
import { getMessages, type Messages } from '../../../../i18n/messages.ts';
import { SiteHeader } from '../../../../components/SiteHeader.tsx';
import { Breadcrumbs, LinkList, PlaceList } from '../../../../components/content.tsx';
import { PlaceBody, Prose } from '../../../../components/place-templates.tsx';
import { getCity, getDish, getGuide, getPlace, resolveRoute, seoInfo } from '../../../../lib/data.ts';
import { absoluteUrl, indexingEnabled, pageMetadata } from '../../../../lib/seo.ts';
import { JsonLd } from '../../../../components/JsonLd.tsx';
import { breadcrumbJsonLd, restaurantJsonLd } from '../../../../../../seo/json-ld.ts';
import { weekToSpecification } from '../../../../../shared/week.ts';
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
  const { data, kind, section, locale } = await load(params);
  if (!data) return {};
  const seo = await seoInfo(kind, data.slug, locale);
  return pageMetadata({
    locale, title: seo.title ?? data.name, description: seo.description ?? data.summary, indexable: seo.indexableLocales,
    paths: Object.fromEntries(data.locales.map((l) => [l, sectionPath(l, section as Section, data.slug)])),
  });
}

/** Fotos de plato, guía o ciudad: sin ninguna no se pinta nada (un plato sin foto no es un hueco a rellenar, como en un lugar). */
function Gallery({ photos, empty }: { photos: PhotoView[]; empty: string }) {
  if (!photos.length) return null;
  return (
    <div className={styles.gallery}>
      {photos.slice(0, 3).map((ph, i) => <Photo key={ph.src} src={ph.src} alt={ph.alt} emptyLabel={empty} priority={i === 0} />)}
    </div>
  );
}

function crumbs(t: Messages, locale: Locale, section: Section, name: string) {
  return [{ name: t.nav.home, href: `/${locale}` }, { name: t.sections[section], href: sectionPath(locale, section) }, { name }];
}

/** Subtipo de schema.org más específico para cada tipo de lugar (norma vigente de Google). */
const SCHEMA_TYPE: Record<PlaceSection, string> = {
  restaurantes: 'Restaurant', 'cafes-y-teterias': 'CafeOrCoffeeShop', 'comida-callejera': 'FoodEstablishment', 'mercados-y-zocos': 'LocalBusiness',
};

/** Ficha de lugar, plato, guía o ciudad. */
export default async function Detail({ params }: { params: Params }) {
  const page = await load(params);
  if (!page.data) notFound();
  const { locale, section } = page;
  const t = getMessages(locale);

  let body;
  if (page.kind === 'place') {
    body = <PlaceBody place={page.data} locale={locale} />;
  } else if (page.kind === 'dish') {
    const d = page.data;
    body = (
      <>
        {d.summary && <p className={styles.lead}>{d.summary}</p>}
        <Gallery photos={d.photos} empty={t.noPhoto} />
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
        <Gallery photos={g.photos} empty={t.noPhoto} />
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
        <Gallery photos={c.photos} empty={t.noPhoto} />
        <Prose text={c.content} />
        {PLACE_SECTIONS.some((s) => c.places.some((p) => p.section === s)) && (
          <section className={styles.section}>
            <h2>{t.explore}</h2>
            <ul className={styles.chips}>
              {PLACE_SECTIONS.filter((s) => c.places.some((p) => p.section === s)).map((s) => <li key={s}><a href={cityTypePath(locale, c.slug, s)}>{t.sections[s]}</a></li>)}
            </ul>
          </section>
        )}
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

  const seo = await seoInfo(page.kind, page.data.slug, locale);
  const crumbItems = crumbs(t, locale, section as Section, page.data.name);
  const indexable = indexingEnabled() && seo.indexableLocales.includes(locale);
  const selfUrl = absoluteUrl(sectionPath(locale, section as Section, page.data.slug));
  // Google exige dirección en los datos de un negocio: sin ella, no se emiten. La valoración solo con reseñas aprobadas y visibles aquí.
  const place = page.kind === 'place' ? page.data : null;
  const business = indexable && place?.address ? restaurantJsonLd({
    type: SCHEMA_TYPE[place.section], name: place.name, url: selfUrl, description: place.summary ?? undefined,
    images: place.photos.map((ph) => absoluteUrl(ph.src)), address: { street: place.address, city: place.city?.name }, lat: place.lat, lng: place.lng,
    telephone: place.phone ?? undefined, openingHoursSpecification: weekToSpecification(place.hoursRaw),
    approvedReviews: place.rating.average === null ? undefined : { count: place.rating.count, average: place.rating.average },
    menuUrl: place.hasMenu ? absoluteUrl(sectionPath(locale, place.section, place.slug, MENU_SEGMENT)) : undefined,
  }) : null;
  const breadcrumb = indexable ? breadcrumbJsonLd(crumbItems.map((c) => ({ name: c.name, url: c.href ? absoluteUrl(c.href) : selfUrl }))) : null;

  return (
    <>
      <JsonLd data={business} />
      <JsonLd data={breadcrumb} />
      <SiteHeader locale={locale} available={page.data.locales} />
      <main id="contenido" className={styles.main}>
        <Breadcrumbs label={t.breadcrumb} items={crumbItems} />
        <h1 className={styles.title}>{page.data.name}</h1>
        {body}
      </main>
    </>
  );
}
