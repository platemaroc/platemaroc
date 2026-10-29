/** Sitemaps con alternates hreflang (solo es/en/fr). Máximo 50 000 URLs por archivo. */
import type { Locale } from '../shared/locales.ts';
import { SITE_URL } from '../../seo/types.ts';

export interface SitemapEntry { url: string; alternates?: Partial<Record<Locale, string>>; lastmod?: string }
export const MAX_URLS_PER_SITEMAP = 50_000;

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');

export function buildSitemapXml(entries: SitemapEntry[]): string {
  const body = entries.map((e) => {
    const alts = Object.entries(e.alternates ?? {}).map(([l, href]) => `<xhtml:link rel="alternate" hreflang="${esc(l)}" href="${esc(href!)}"/>`).join('');
    return `<url><loc>${esc(e.url)}</loc>${e.lastmod ? `<lastmod>${esc(e.lastmod)}</lastmod>` : ''}${alts}</url>`;
  }).join('');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${body}</urlset>\n`;
}

/** Divide en varios archivos si hace falta y devuelve el índice cuando hay más de uno. */
export function buildSitemaps(entries: SitemapEntry[], max = MAX_URLS_PER_SITEMAP): { files: Record<string, string>; index?: string } {
  if (entries.length <= max) return { files: { 'sitemap.xml': buildSitemapXml(entries) } };
  const files: Record<string, string> = {};
  for (let n = 0; n * max < entries.length; n++) files[`sitemap-${n + 1}.xml`] = buildSitemapXml(entries.slice(n * max, (n + 1) * max));
  const index = `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${Object.keys(files).map((f) => `<sitemap><loc>${SITE_URL}/${f}</loc></sitemap>`).join('')}</sitemapindex>\n`;
  return { files, index };
}
