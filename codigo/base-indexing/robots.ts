import { SITE_URL } from '../../seo/types.ts';

/** Rutas que no deben rastrearse. robots.txt NO desindexa: la desindexación se hace con `noindex` (seo/metadata.ts). */
export const DISALLOWED_PATHS = ['/admin', '/api/', '/auth', '/cuenta'];

export function buildRobotsTxt(): string {
  return ['User-agent: *', ...DISALLOWED_PATHS.map((p) => `Disallow: ${p}`), '', `Sitemap: ${SITE_URL}/sitemap.xml`, ''].join('\n');
}
