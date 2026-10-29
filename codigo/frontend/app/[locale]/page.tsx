import { PLACE_SECTIONS, sectionPath } from '../../../shared/routes.ts';
import { SITE_NAME } from '../../../../seo/types.ts';
import { getMessages } from '../../i18n/messages.ts';
import { SiteHeader } from '../../components/SiteHeader.tsx';
import { LinkList, PlaceList } from '../../components/content.tsx';
import { listCities, listGuides, listPlaces, resolveRoute } from '../../lib/data.ts';
import styles from './templates.module.css';

/** Portada: tipos de lugar, últimos lugares, guías y ciudades. */
export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await resolveRoute(params);
  const t = getMessages(locale);
  const [places, guides, cities] = await Promise.all([listPlaces(locale, { limit: 6 }), listGuides(locale), listCities(locale)]);
  return (
    <>
      <SiteHeader locale={locale} />
      <main id="contenido" className={styles.main}>
        <h1 className={styles.title}>{SITE_NAME}</h1>
        <p className={styles.lead}>{t.tagline}</p>

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
      </main>
    </>
  );
}
