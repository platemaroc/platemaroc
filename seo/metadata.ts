/**
 * Metadatos SEO (canónica, hreflang, robots) — docs/01-documento-maestro-operacion.md §4 y §13.
 * - hreflang SOLO entre es/en/fr, y solo para versiones con traducción publicada e indexables.
 * - Una página que falla el Quality Gate puede existir pero sale como noindex (no se elimina).
 * - No se añaden claims sobre cómo trata Google ninguna técnica concreta.
 */
import type { Locale } from '../codigo/shared/locales.ts';
import { SITE_URL, type PageVersion } from './types.ts';

const clean = (p: string) => p.replace(/^\/+|\/+$/g, '');

export function pageUrl(locale: Locale, path: string): string {
  const p = clean(path);
  // Sin barra final: es la URL que sirve la web (con barra, Next.js redirige).
  return `${SITE_URL}/${locale}${p ? `/${p}` : ''}`;
}

export interface PageMetadata {
  title: string;
  description: string;
  alternates: { canonical: string; languages: Partial<Record<Locale, string>> };
  robots: { index: boolean; follow: boolean };
}

/** Metadatos de la versión `current` dentro del conjunto `versions` de la misma entidad. */
export function buildPageMetadata(current: PageVersion, versions: PageVersion[]): PageMetadata {
  const indexable = current.translationPublished && current.isIndexable;
  let languages: Partial<Record<Locale, string>> = {};
  if (indexable) {
    for (const v of versions) {
      if (v.translationPublished && v.isIndexable) languages[v.locale] = pageUrl(v.locale, v.path);
    }
    // Con una sola versión, hreflang no aporta nada: se omite.
    if (Object.keys(languages).length < 2) languages = {};
  }
  return {
    title: current.title,
    description: current.description,
    alternates: { canonical: pageUrl(current.locale, current.path), languages },
    robots: { index: indexable, follow: true },
  };
}

/** Una URL entra en el sitemap solo si es indexable (maestro §4: "fuera del sitemap"). */
export function sitemapEntries(versions: PageVersion[]): { url: string; alternates: Partial<Record<Locale, string>> }[] {
  return versions
    .filter((v) => v.translationPublished && v.isIndexable)
    .map((v) => ({ url: pageUrl(v.locale, v.path), alternates: buildPageMetadata(v, versions).alternates.languages }));
}
