import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CONSENT_VERSION } from '../../../../../backend/reviews/validate.ts';
import { LOCALES } from '../../../../../shared/locales.ts';
import { Breadcrumbs } from '../../../../components/content.tsx';
import { SiteHeader } from '../../../../components/SiteHeader.tsx';
import { CONTACT_EMAIL, INFO_PAGES, INFO_SLUGS, isInfoSlug, LEGAL_SLUGS } from '../../../../i18n/info-pages.ts';
import { getMessages } from '../../../../i18n/messages.ts';
import { resolveRoute } from '../../../../lib/data.ts';
import { pageMetadata } from '../../../../lib/seo.ts';
import styles from '../../templates.module.css';

type Params = Promise<{ locale: string; slug: string }>;

async function load(params: Params) {
  const { locale } = await resolveRoute(params);
  const { slug } = await params;
  if (!isInfoSlug(slug)) notFound();
  return { locale, slug, page: INFO_PAGES[slug][locale] };
}

export const generateStaticParams = () => LOCALES.flatMap((locale) => INFO_SLUGS.map((slug) => ({ locale, slug })));

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale, slug, page } = await load(params);
  // Ninguna se indexa todavía: las legales son borradores y las demás se abrirán con ellas.
  return pageMetadata({ locale, title: page.title, indexable: [], paths: Object.fromEntries(LOCALES.map((l) => [l, `/${l}/info/${slug}`])) });
}

/** Páginas del pie: sobre nosotros, contacto, reseñas y textos legales. */
export default async function InfoPage({ params }: { params: Params }) {
  const { locale, slug, page } = await load(params);
  const t = getMessages(locale);
  return (
    <>
      <SiteHeader locale={locale} />
      <main id="contenido" className={styles.main}>
        <Breadcrumbs label={t.breadcrumb} items={[{ name: t.nav.home, href: `/${locale}` }, { name: page.title }]} />
        <h1 className={styles.title}>{page.title}</h1>
        {LEGAL_SLUGS.includes(slug) && <p role="note" className={styles.draft}>{t.privacy.draft}</p>}
        <div className={styles.prose}>
          {page.blocks.map((b, i) => (typeof b === 'string' ? <p key={i}>{b}</p> : <h2 key={i}>{b.h}</h2>))}
        </div>
        {slug === 'contacto' && <p><a className={styles.textLink} href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a></p>}
        {slug === 'privacidad' && <p className={styles.lead}><small>{CONSENT_VERSION}</small></p>}
      </main>
    </>
  );
}
