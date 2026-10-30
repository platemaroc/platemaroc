import 'server-only';
import type { Metadata } from 'next';
import { LOCALES, type Locale } from '../../shared/locales.ts';
import { buildPageMetadata } from '../../../seo/metadata.ts';
import { SITE_NAME, SITE_URL, type PageVersion } from '../../../seo/types.ts';

/**
 * Interruptor general (decisión del titular, 30-10-2026). Apagado: todo noindex y robots.txt bloquea.
 * Se enciende solo en producción, al lanzar la web. Así, ni la web en obras ni un entorno de pruebas entran en Google.
 */
export const indexingEnabled = () => process.env.SITE_INDEXING_ENABLED === '1';

/** Quita `/es` de `/es/restaurantes/x`: seo/metadata.ts añade el idioma. */
const stripLocale = (p: string) => p.replace(/^\/(es|en|fr)(\/|$)/, '');

/**
 * Metadatos de una página. `paths`: su ruta en cada idioma. `indexable`: idiomas que pasan el Quality Gate.
 * hreflang recíproco y con la propia página (norma vigente de Google), solo entre versiones indexables; sin x-default (opcional, y
 * el maestro §13 limita hreflang a es/en/fr). Por defecto el layout raíz deja noindex: solo se abre lo que esta función aprueba.
 */
export function pageMetadata(o: { locale: Locale; title: string; description?: string | null; paths: Partial<Record<Locale, string>>; indexable: readonly Locale[]; absoluteTitle?: boolean }): Metadata {
  const version = (l: Locale): PageVersion => ({
    locale: l, path: stripLocale(o.paths[l] ?? ''), isIndexable: indexingEnabled() && o.indexable.includes(l), translationPublished: true, title: o.title, description: o.description ?? '',
  });
  const versions = LOCALES.filter((l) => o.paths[l]).map(version);
  const m = buildPageMetadata(version(o.locale), versions);
  return {
    title: o.absoluteTitle ? { absolute: o.title } : o.title,
    description: o.description ?? undefined,
    alternates: { canonical: m.alternates.canonical, languages: m.alternates.languages },
    robots: { index: m.robots.index, follow: true },
    openGraph: { title: o.title, description: o.description ?? undefined, url: m.alternates.canonical, siteName: SITE_NAME, locale: o.locale, type: 'website' },
  };
}

export const absoluteUrl = (path: string) => `${SITE_URL}${path}`;
