import type { Metadata } from 'next';
import { isPlaceSection, PLACE_SECTIONS, sectionPath } from '../../../../shared/routes.ts';
import { getMessages } from '../../../i18n/messages.ts';
import { SiteHeader } from '../../../components/SiteHeader.tsx';
import { Breadcrumbs, LinkList, PlaceList } from '../../../components/content.tsx';
import { LOCALES } from '../../../../shared/locales.ts';
import { listCities, listDishes, listGuides, listingIndexableLocales, listPlaces, resolveRoute } from '../../../lib/data.ts';
import { pageMetadata } from '../../../lib/seo.ts';
import styles from '../templates.module.css';

type Params = Promise<{ locale: string; section: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale, section } = await resolveRoute(params);
  const t = getMessages(locale);
  return pageMetadata({
    locale, title: t.sections[section!], description: t.tagline, indexable: await listingIndexableLocales(section!),
    paths: Object.fromEntries(LOCALES.map((l) => [l, sectionPath(l, section!)])),
  });
}

/** Listados: un tipo de lugar, todos los lugares, platos típicos, guías o ciudades. */
export default async function Listing({ params }: { params: Params }) {
  const { locale, section: s } = await resolveRoute(params);
  const section = s!;
  const t = getMessages(locale);

  let body;
  if (isPlaceSection(section)) {
    body = <PlaceList heading="h2" places={await listPlaces(locale, { section })} locale={locale} />;
  } else if (section === 'lugares') {
    body = (
      <>
        <ul className={styles.tiles}>
          {PLACE_SECTIONS.map((p) => <li key={p}><a href={sectionPath(locale, p)}>{t.sections[p]}</a></li>)}
        </ul>
        <div className={styles.section}><PlaceList heading="h2" places={await listPlaces(locale)} locale={locale} /></div>
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
