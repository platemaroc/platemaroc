import { LOCALES, type Locale } from '../../shared/locales.ts';
import { sectionFromSegment, SEGMENTS } from '../../shared/routes.ts';
import { splitLocale } from './config.ts';

/**
 * Misma página en otro idioma: se traduce el segmento de sección y se conserva el resto (el slug es igual en los tres idiomas).
 * Devuelve null si la ruta no es de contenido conocido.
 */
export function translatePath(pathname: string, to: Locale): string | null {
  const { locale, rest } = splitLocale(pathname);
  if (!locale) return null;
  const parts = rest.split('/').filter(Boolean);
  if (!parts.length) return `/${to}`;
  const section = sectionFromSegment(locale, parts[0]);
  if (!section) return null;
  return ['', to, SEGMENTS[section][to], ...parts.slice(1)].join('/');
}

/**
 * Enlaces del selector de idioma. `available` = idiomas en los que la página está publicada (si se sabe):
 * para los demás se enlaza la portada de ese idioma, nunca una página que daría 404.
 */
export function languageLinks(pathname: string, current: Locale, available?: readonly Locale[]): { locale: Locale; href: string }[] {
  return LOCALES.filter((l) => l !== current).map((l) => {
    const translated = translatePath(pathname, l);
    return { locale: l, href: translated && (!available || available.includes(l)) ? translated : `/${l}` };
  });
}
