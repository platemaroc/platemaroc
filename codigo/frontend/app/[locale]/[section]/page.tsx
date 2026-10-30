import type { Metadata } from 'next';
import { isPlaceSection, PLACE_SECTIONS, sectionPath } from '../../../../shared/routes.ts';
import { getMessages } from '../../../i18n/messages.ts';
import { SiteHeader } from '../../../components/SiteHeader.tsx';
import { SearchForm } from '../../../components/SearchForm.tsx';
import { Breadcrumbs, LinkList, PlaceList } from '../../../components/content.tsx';
import { LOCALES } from '../../../../shared/locales.ts';
import { cleanSearchParam } from '../../../../shared/search.ts';
import { listCities, listDishes, listGuides, listingIndexableLocales, resolveRoute, searchContent } from '../../../lib/data.ts';
import { pageMetadata } from '../../../lib/seo.ts';
import styles from '../templates.module.css';

type Params = Promise<{ locale: string; section: string }>;
type Query = Promise<Record<string, string | string[] | undefined>>;

const isFiltered = (query: Record<string, unknown>) => !!(cleanSearchParam(query.q) || cleanSearchParam(query.ciudad));

export async function generateMetadata({ params, searchParams }: { params: Params; searchParams: Query }): Promise<Metadata> {
  const { locale, section } = await resolveRoute(params);
  const t = getMessages(locale);
  const searchable = section === 'lugares' || isPlaceSection(section!);
  return pageMetadata({
    locale, title: t.sections[section!], description: t.tagline,
    // Una búsqueda nunca se indexa: serían infinitas URLs casi vacías. La canónica sigue siendo el listado.
    indexable: searchable && isFiltered(await searchParams) ? [] : await listingIndexableLocales(section!),
    paths: Object.fromEntries(LOCALES.map((l) => [l, sectionPath(l, section!)])),
  });
}

/** Listados: un tipo de lugar, todos los lugares, platos típicos, guías o ciudades. Los de lugares admiten ?q= y ?ciudad=. */
export default async function Listing({ params, searchParams }: { params: Params; searchParams: Query }) {
  const { locale, section: s } = await resolveRoute(params);
  const section = s!;
  const t = getMessages(locale);

  let body;
  if (section === 'lugares' || isPlaceSection(section)) {
    const placeSection = section === 'lugares' ? undefined : section;
    const query = await searchParams;
    const q = cleanSearchParam(query.q);
    const cities = await listCities(locale);
    const city = cities.find((c) => c.slug === cleanSearchParam(query.ciudad))?.slug ?? '';
    const found = await searchContent(locale, { q, citySlug: city || undefined, section: placeSection });
    const filtered = !!(q || city);
    const total = found.places.length + found.dishes.length + found.guides.length + found.cities.length;
    const links = (key: 'platos-tipicos' | 'guias-gastronomicas' | 'ciudades-y-barrios', items: { slug: string; name: string; summary?: string | null }[]) => !!items.length && (
      <div className={styles.section}>
        <h2>{t.sections[key]}</h2>
        <LinkList heading="h3" empty={t.empty} items={items.map((x) => ({ href: sectionPath(locale, key, x.slug), name: x.name, summary: x.summary }))} />
      </div>
    );
    body = (
      <>
        <SearchForm locale={locale} section={section} q={q} city={city} cities={cities} />
        {filtered ? <p role="status" className={styles.lead}>{total ? t.searchForm.results.replace('{count}', String(total)) : t.searchForm.none}</p> : section === 'lugares' && (
          <ul className={styles.tiles}>
            {PLACE_SECTIONS.map((p) => <li key={p}><a href={sectionPath(locale, p)}>{t.sections[p]}</a></li>)}
          </ul>
        )}
        {(!filtered || found.places.length > 0) && <div className={styles.section}><PlaceList heading="h2" places={found.places} locale={locale} /></div>}
        {links('platos-tipicos', found.dishes)}
        {links('guias-gastronomicas', found.guides)}
        {links('ciudades-y-barrios', found.cities)}
      </>
    );
  } else {
    const items = section === 'platos-tipicos' ? await listDishes(locale) : section === 'guias-gastronomicas' ? await listGuides(locale) : await listCities(locale);
    body = <LinkList heading="h2" empty={t.empty} items={items.map((x) => ({ href: sectionPath(locale, section, x.slug), name: x.name, summary: x.summary }))} />;
  }

  return (
    <>
      <SiteHeader locale={locale} />
      <main id="contenido" className={styles.main}>
        <Breadcrumbs label={t.breadcrumb} items={[{ name: t.nav.home, href: `/${locale}` }, { name: t.sections[section] }]} />
        <h1 className={styles.title}>{t.sections[section]}</h1>
        {body}
      </main>
    </>
  );
}
