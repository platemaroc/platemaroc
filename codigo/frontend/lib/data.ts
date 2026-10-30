import 'server-only';
import { notFound } from 'next/navigation';
import { contentSource } from '../../backend/content/index.ts';
import { cached } from '../../backend/content/cache.ts';
import { isLocale, type Locale } from '../i18n/config.ts';
import { getMessages } from '../i18n/messages.ts';
import { LOCALES } from '../../shared/locales.ts';
import { applyPlaceFilters, hasFilters, type PlaceFilters } from '../../shared/place-filters.ts';
import { cityTypePath, isPlaceSection, PLACE_SECTIONS, sectionFromSegment, type PlaceSection, type Section } from '../../shared/routes.ts';
import { matchesSearch } from '../../shared/search.ts';

/** Datos públicos con caché de 60 s (backend/content/cache.ts). Solo contenido público: nunca datos de un usuario. */
type Source = ReturnType<typeof contentSource>;
const source = () => contentSource();
const mem = <K extends keyof Source>(name: K) => ((...args: unknown[]) => (
  source().isDemo ? (source()[name] as any)(...args) : cached(`${String(name)}:${JSON.stringify(args)}`, () => (source()[name] as any)(...args))
)) as Source[K];

export const isDemo = () => source().isDemo;
export const listPlaces = mem('listPlaces');
export const getPlace = mem('getPlace');
export const getMenu = mem('getMenu');
export const listDishes = mem('listDishes');
export const getDish = mem('getDish');
export const listGuides = mem('listGuides');
export const getGuide = mem('getGuide');
export const listCities = mem('listCities');
export const getCity = mem('getCity');
export const seoInfo = mem('seoInfo');
export const listIndexable = mem('listIndexable');
export const getNeighborhood = mem('getNeighborhood');

/** Idioma y sección de la URL; cualquier otra cosa (p. ej. /ar o un segmento de otro idioma) es 404. */
export async function resolveRoute(params: Promise<{ locale: string; section?: string }>): Promise<{ locale: Locale; section: Section | null }> {
  const { locale, section } = await params;
  if (!isLocale(locale)) notFound();
  if (section === undefined) return { locale, section: null };
  const resolved = sectionFromSegment(locale, section);
  if (!resolved) notFound();
  return { locale, section: resolved };
}

/**
 * Busca entre lo público, así que nunca aparece un borrador. Filtra en memoria los listados con caché: no añade consultas a la base.
 * Con cualquier filtro solo hay lugares, porque platos, guías y ciudades no tienen ciudad, tipo, precio ni valoración.
 */
export async function searchContent(locale: Locale, o: { q: string; citySlug?: string; filters: PlaceFilters }) {
  const label = getMessages(locale).sections;
  const { section, neighborhood } = o.filters;
  const found = (await listPlaces(locale, { section, citySlug: o.citySlug, neighborhoodSlug: o.citySlug && neighborhood ? neighborhood : undefined }))
    .filter((p) => matchesSearch(o.q, [p.name, p.summary, p.city?.name, p.neighborhood?.name, label[p.section]]));
  const places = applyPlaceFilters(found, o.filters);
  if (o.citySlug || hasFilters(o.filters) || !o.q) return { places, dishes: [], guides: [], cities: [] };
  const hit = <T extends { name: string; summary?: string | null }>(items: T[]) => items.filter((x) => matchesSearch(o.q, [x.name, x.summary]));
  const [dishes, guides, cities] = await Promise.all([listDishes(locale), listGuides(locale), listCities(locale)]);
  return { places, dishes: hit(dishes), guides: hit(guides), cities: hit(cities) };
}

/** Un listado solo se indexa con al menos 3 fichas indexables en ese idioma (decisión del titular): evita páginas casi vacías. */
export const MIN_INDEXABLE_ITEMS = 3;

/** Tipo de lugar en una ciudad: misma regla que los listados. */
export async function cityTypeIndexableLocales(citySlug: string, section: PlaceSection): Promise<Locale[]> {
  const counts = await Promise.all(LOCALES.map(async (l) => (await listPlaces(l, { section, citySlug })).filter((p) => p.indexable).length));
  return LOCALES.filter((_, i) => counts[i] >= MIN_INDEXABLE_ITEMS);
}

/** Páginas de ciudad por tipo que pasan esa regla, para el sitemap. */
export async function listCityTypePages(): Promise<Partial<Record<Locale, string>>[]> {
  const slugs = new Set((await Promise.all(LOCALES.map((l) => listCities(l)))).flat().map((c) => c.slug));
  const pages = await Promise.all([...slugs].flatMap((slug) => PLACE_SECTIONS.map(async (section) => {
    const locales = await cityTypeIndexableLocales(slug, section);
    return Object.fromEntries(locales.map((l) => [l, cityTypePath(l, slug, section)]));
  })));
  return pages.filter((p) => Object.keys(p).length > 0);
}

export async function listingIndexableLocales(section: Section): Promise<Locale[]> {
  const counts = await Promise.all(LOCALES.map(async (l) => {
    const items: { indexable?: boolean }[] = isPlaceSection(section) ? await listPlaces(l, { section }) : section === 'lugares' ? await listPlaces(l)
      : section === 'platos-tipicos' ? await listDishes(l) : section === 'guias-gastronomicas' ? await listGuides(l) : await listCities(l);
    return items.filter((x) => x.indexable).length;
  }));
  return LOCALES.filter((_, i) => counts[i] >= MIN_INDEXABLE_ITEMS);
}
