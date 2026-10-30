import 'server-only';
import { notFound } from 'next/navigation';
import { contentSource } from '../../backend/content/index.ts';
import { cached } from '../../backend/content/cache.ts';
import { isLocale, type Locale } from '../i18n/config.ts';
import { LOCALES } from '../../shared/locales.ts';
import { isPlaceSection, sectionFromSegment, type Section } from '../../shared/routes.ts';

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

/** Un listado solo se indexa con al menos 3 fichas indexables en ese idioma (decisión del titular): evita páginas casi vacías. */
export const MIN_INDEXABLE_ITEMS = 3;

export async function listingIndexableLocales(section: Section): Promise<Locale[]> {
  const counts = await Promise.all(LOCALES.map(async (l) => {
    const items: { indexable?: boolean }[] = isPlaceSection(section) ? await listPlaces(l, { section }) : section === 'lugares' ? await listPlaces(l)
      : section === 'platos-tipicos' ? await listDishes(l) : section === 'guias-gastronomicas' ? await listGuides(l) : await listCities(l);
    return items.filter((x) => x.indexable).length;
  }));
  return LOCALES.filter((_, i) => counts[i] >= MIN_INDEXABLE_ITEMS);
}
