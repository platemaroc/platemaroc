import { PLACE_SECTIONS, sectionPath } from '../../../shared/routes.ts';
import type { Metadata } from 'next';
import { SITE_NAME } from '../../../../seo/types.ts';
import { websiteJsonLd } from '../../../../seo/json-ld.ts';
import { LOCALES } from '../../../shared/locales.ts';
import { JsonLd } from '../../components/JsonLd.tsx';
import { indexingEnabled, pageMetadata } from '../../lib/seo.ts';
import { getMessages } from '../../i18n/messages.ts';
import { SearchForm } from '../../components/SearchForm.tsx';
import { SiteHeader } from '../../components/SiteHeader.tsx';
import { LinkList, PlaceList } from '../../components/content.tsx';
import { listCities, listGuides, listPlaces, resolveRoute } from '../../lib/data.ts';
import styles from './templates.module.css';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await resolveRoute(params);
  const t = getMessages(locale);
  return pageMetadata({ locale, title: `${SITE_NAME}: ${t.tagline}`, description: t.tagline, absoluteTitle: true, indexable: LOCALES, paths: { es: '/es', en: '/en', fr: '/fr' } });
}

/** Portada: tipos de lugar, últimos lugares, guías y ciudades. */
export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await resolveRoute(params);
  const t = getMessages(locale);
  const [places, guides, cities] = await Promise.all([listPlaces(locale, { limit: 6 }), listGuides(locale), listCities(locale)]);
  return (
    <>
      {indexingEnabled() && <JsonLd data={websiteJsonLd()} />}
      <SiteHeader locale={locale} />
      <main id="contenido">
        <div className={styles.hero}>
          <div className={styles.heroInner}>
            <h1>{t.tagline}</h1>
            <SearchForm locale={locale} compact />
          </div>
        </div>
        <div className={styles.main}>

        <section className={styles.section} aria-labelledby="tipos">
          <h2 id="tipos">{t.explore}</h2>
          <ul className={styles.tiles}>
            {PLACE_SECTIONS.map((s) => <li key={s}><a href={sectionPath(locale, s)}>{t.sections[s]}</a></li>)}
          </ul>
        </section>

        <section className={styles.section} aria-labelledby="lugares">
          <h2 id="lugares">{t.sections.lugares}</h2>
          <PlaceList places={places} locale={locale} />
        </section>

        <section className={styles.section} aria-labelledby="guias">
          <h2 id="guias">{t.sections['guias-gastronomicas']}</h2>
          <LinkList empty={t.empty} items={guides.map((g) => ({ href: sectionPath(locale, 'guias-gastronomicas', g.slug), name: g.name, summary: g.summary }))} />
        </section>

        <section className={styles.section} aria-labelledby="ciudades">
          <h2 id="ciudades">{t.sections['ciudades-y-barrios']}</h2>
          <LinkList empty={t.empty} items={cities.map((c) => ({ href: sectionPath(locale, 'ciudades-y-barrios', c.slug), name: c.name, summary: c.summary }))} />
        </section>
        </div>
      </main>
    </>
  );
}
