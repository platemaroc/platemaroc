import { buildSitemapXml, type SitemapEntry } from '../../../base-indexing/sitemap.ts';
import { LOCALES, type Locale } from '../../../shared/locales.ts';
import { PLACE_SECTIONS, sectionPath, type Section } from '../../../shared/routes.ts';
import { listIndexable, listingIndexableLocales } from '../../lib/data.ts';
import { absoluteUrl, indexingEnabled } from '../../lib/seo.ts';

const LISTINGS: Section[] = [...PLACE_SECTIONS, 'lugares', 'platos-tipicos', 'guias-gastronomicas', 'ciudades-y-barrios'];

function entries(paths: Partial<Record<Locale, string>>, lastmod?: string | null): SitemapEntry[] {
  const list = Object.entries(paths) as [Locale, string][];
  const alternates = list.length > 1 ? Object.fromEntries(list.map(([l, p]) => [l, absoluteUrl(p)])) : undefined;
  return list.map(([, p]) => ({ url: absoluteUrl(p), alternates, lastmod: lastmod ?? undefined }));
}

/** Solo URLs indexables (maestro §4: lo que no pasa el Quality Gate queda fuera). Con el interruptor apagado, vacío. */
export async function GET() {
  const items: SitemapEntry[] = [];
  if (indexingEnabled()) {
    items.push(...entries(Object.fromEntries(LOCALES.map((l) => [l, `/${l}`]))));
    for (const section of LISTINGS) {
      const locales = await listingIndexableLocales(section);
      items.push(...entries(Object.fromEntries(locales.map((l) => [l, sectionPath(l, section)]))));
    }
    for (const e of await listIndexable()) items.push(...entries(e.paths, e.lastmod));
  }
  return new Response(buildSitemapXml(items), { headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=3600' } });
}
