import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isPlaceSection, MENU_SEGMENT, sectionPath } from '../../../../../../shared/routes.ts';
import { EmptyState, Price } from '../../../../../../components-ui/mobile-design/ui.tsx';
import { getMessages } from '../../../../../i18n/messages.ts';
import { SiteHeader } from '../../../../../components/SiteHeader.tsx';
import { Breadcrumbs, PlaceList } from '../../../../../components/content.tsx';
import { getMenu, getNeighborhood, resolveRoute, seoInfo } from '../../../../../lib/data.ts';
import { pageMetadata } from '../../../../../lib/seo.ts';
import styles from '../../../templates.module.css';

type Params = Promise<{ locale: string; section: string; slug: string; sub: string }>;

/** /{lugar}/menu → menú digital; /{ciudad}/{barrio} → barrio. Cualquier otra combinación es 404. */
async function load(params: Params) {
  const { locale, section } = await resolveRoute(params);
  const { slug, sub } = await params;
  if (isPlaceSection(section!) && sub === MENU_SEGMENT) return { locale, kind: 'menu' as const, section, data: await getMenu(locale, section, slug) };
  if (section === 'ciudades-y-barrios') return { locale, kind: 'neighborhood' as const, section, data: await getNeighborhood(locale, slug, sub) };
  notFound();
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const page = await load(params);
  if (!page.data) return {};
  const t = getMessages(page.locale);
  if (page.kind === 'menu') {
    const m = page.data;
    return pageMetadata({
      locale: page.locale, title: `${t.menu} · ${m.place.name}`, description: `${t.menu} · ${m.place.name}`, indexable: m.indexableLocales,
      paths: Object.fromEntries(m.locales.map((l) => [l, sectionPath(l, m.place.section, m.place.slug, MENU_SEGMENT)])),
    });
  }
  const n = page.data;
  const seo = await seoInfo('neighborhood', n.slug, page.locale, n.city.slug);
  return pageMetadata({
    locale: page.locale, title: seo.title ?? n.name, description: seo.description ?? n.summary, indexable: seo.indexableLocales,
    paths: Object.fromEntries(n.locales.map((l) => [l, sectionPath(l, 'ciudades-y-barrios', n.city.slug, n.slug)])),
  });
}

export default async function SubPage({ params }: { params: Params }) {
  const page = await load(params);
  if (!page.data) notFound();
  const { locale } = page;
  const t = getMessages(locale);

  if (page.kind === 'menu') {
    const m = page.data;
    const placeHref = sectionPath(locale, m.place.section, m.place.slug);
    return (
      <>
        <SiteHeader locale={locale} available={m.locales} />
        <main id="contenido" className={styles.main}>
          <Breadcrumbs label={t.breadcrumb} items={[
            { name: t.nav.home, href: `/${locale}` }, { name: t.sections[m.place.section], href: sectionPath(locale, m.place.section) },
            { name: m.place.name, href: placeHref }, { name: t.menu },
          ]} />
          <h1 className={styles.title}>{t.menu} · {m.place.name}</h1>
          {m.categories.length === 0 && <EmptyState>{t.noMenu}</EmptyState>}
          {m.categories.map((c, i) => (
            <section key={i} className={styles.menuCategory}>
              <h2>{c.name}</h2>
              <ul className={styles.menuItems}>
                {c.items.map((item, j) => (
                  <li key={j} className={styles.menuItem}>
                    <span className={item.soldOut ? styles.soldOut : undefined}>{item.name}{item.soldOut && ` · ${t.soldOut}`}</span>
                    <Price amountMad={item.priceMad} locale={locale} pendingLabel={t.pricePending} />
                    {item.description && <p>{item.description}</p>}
                    {item.allergens.length > 0 && <p>{t.allergens}: {item.allergens.join(', ')}</p>}
                  </li>
                ))}
              </ul>
            </section>
          ))}
          <p className={styles.section}><a className={styles.textLink} href={placeHref}>{t.backToPlace}</a></p>
        </main>
      </>
    );
  }

  const n = page.data;
  return (
    <>
      <SiteHeader locale={locale} available={n.locales} />
      <main id="contenido" className={styles.main}>
        <Breadcrumbs label={t.breadcrumb} items={[
          { name: t.nav.home, href: `/${locale}` }, { name: t.sections['ciudades-y-barrios'], href: sectionPath(locale, 'ciudades-y-barrios') },
          { name: n.city.name, href: sectionPath(locale, 'ciudades-y-barrios', n.city.slug) }, { name: n.name },
        ]} />
        <h1 className={styles.title}>{n.name}</h1>
        {n.summary && <p className={styles.lead}>{n.summary}</p>}
        <section className={styles.section}><h2>{t.placesHere}</h2><PlaceList places={n.places} locale={locale} /></section>
      </main>
    </>
  );
}
