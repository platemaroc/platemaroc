import type { Locale } from './locales.ts';

/**
 * Rutas públicas por idioma (decisión del titular, 29-10-2026): la sección se traduce y el slug de la entidad es el mismo
 * en los tres idiomas. Ejemplo: /es/restaurantes/x, /en/restaurants/x, /fr/restaurants/x.
 * Las claves coinciden con las carpetas de content/ y con place_types.slug. Los nombres en/fr los debe revisar un nativo
 * (ordenes-claude-code/revisar-traducciones). Cambiar un segmento publicado exige una redirección 301 (la decide el titular).
 */
export const PLACE_SECTIONS = ['restaurantes', 'cafes-y-teterias', 'pastelerias-y-panaderias', 'comida-callejera', 'mercados-y-zocos'] as const;
export type PlaceSection = (typeof PLACE_SECTIONS)[number];
export type Section = PlaceSection | 'lugares' | 'platos-tipicos' | 'guias-gastronomicas' | 'ciudades-y-barrios';

export const SEGMENTS: Record<Section, Record<Locale, string>> = {
  restaurantes: { es: 'restaurantes', en: 'restaurants', fr: 'restaurants' },
  'cafes-y-teterias': { es: 'cafes-y-teterias', en: 'cafes-and-tea-rooms', fr: 'cafes-et-salons-de-the' },
  'pastelerias-y-panaderias': { es: 'pastelerias-y-panaderias', en: 'bakeries-and-pastry-shops', fr: 'patisseries-et-boulangeries' },
  'comida-callejera': { es: 'comida-callejera', en: 'street-food', fr: 'cuisine-de-rue' },
  'mercados-y-zocos': { es: 'mercados-y-zocos', en: 'markets-and-souks', fr: 'marches-et-souks' },
  lugares: { es: 'lugares', en: 'places', fr: 'lieux' },
  'platos-tipicos': { es: 'platos-tipicos', en: 'typical-dishes', fr: 'plats-typiques' },
  'guias-gastronomicas': { es: 'guias-gastronomicas', en: 'food-guides', fr: 'guides-gastronomiques' },
  'ciudades-y-barrios': { es: 'ciudades', en: 'cities', fr: 'villes' },
};

/** Subpágina del menú digital de un lugar. */
export const MENU_SEGMENT = 'menu';

export const isPlaceSection = (s: Section): s is PlaceSection => (PLACE_SECTIONS as readonly string[]).includes(s);

/** Sección a partir del segmento de la URL en ese idioma (un segmento de otro idioma no vale: 404). */
export function sectionFromSegment(locale: Locale, segment: string): Section | null {
  for (const [section, byLocale] of Object.entries(SEGMENTS) as [Section, Record<Locale, string>][]) {
    if (byLocale[locale] === segment) return section;
  }
  return null;
}

/** `/{locale}/{sección}[/slug][/sub]`. */
export function sectionPath(locale: Locale, section: Section, ...rest: string[]): string {
  return ['', locale, SEGMENTS[section][locale], ...rest.filter(Boolean)].join('/');
}

/** Lugares de un tipo en una ciudad: `/es/ciudades/tanger/restaurantes`. El tipo se traduce, como toda sección. */
export const cityTypePath = (locale: Locale, citySlug: string, type: PlaceSection) => sectionPath(locale, 'ciudades-y-barrios', citySlug, SEGMENTS[type][locale]);

/** Para el Service Worker: segmentos de todos los idiomas de las secciones dadas, como alternativa de RegExp. */
export function segmentsAlternation(sections: readonly Section[]): string {
  const all = new Set(sections.flatMap((s) => Object.values(SEGMENTS[s])));
  return `(${[...all].sort().join('|')})`;
}
