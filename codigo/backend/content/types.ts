import type { Locale } from '../../shared/locales.ts';
import type { PlaceSection } from '../../shared/routes.ts';
import { CLOSED, DAY_NAMES, isWeekHours, WEEK } from '../../shared/week.ts';

/**
 * Vistas de contenido público para las plantillas. Solo contienen lo publicado en el idioma pedido:
 * una entidad sin traducción publicada en ese idioma no existe para la página (404).
 */
export interface Ref { slug: string; name: string }
export interface PhotoView { src: string; alt: string }
export interface RatingView { count: number; average: number | null }

export interface PlaceSummary {
  slug: string;
  section: PlaceSection;
  name: string;
  summary: string | null;
  city: Ref | null;
  neighborhood: Ref | null;
  /** 1-4, sin moneda (docs/12: los importes concretos solo en el menú, en MAD). */
  priceRange: number | null;
  rating: RatingView;
  photo: PhotoView | null;
  /** Pasa el Quality Gate en este idioma. */
  indexable?: boolean;
}

export interface ReviewView { author: string; rating: number; comment: string | null; locale: Locale | null; visitedOn: string | null; date: string; photos: PhotoView[] }

export interface PlaceDetail extends PlaceSummary {
  content: string | null;
  /** Solo reseñas aprobadas, en su idioma original (sin traducción automática). */
  reviews: ReviewView[];
  lat: number | null;
  lng: number | null;
  /** Dirección postal (pendiente de añadir al modelo: migración 0010). */
  address: string | null;
  /** Imagen opcional del mapa estático de respaldo, subida por la administración (migración 0010). */
  staticMapSrc: string | null;
  /** Indicaciones de llegada en texto, en el idioma de la página (docs/11). */
  directions: string | null;
  openingHours: [string, string][];
  /** Horario tal como está guardado, para los datos estructurados. */
  hoursRaw?: unknown;
  phone: string | null;
  website: string | null;
  dishes: Ref[];
  hasMenu: boolean;
  photos: PhotoView[];
  /** Idiomas en los que la ficha está publicada (para el selector de idioma). */
  locales: Locale[];
}

export interface MenuItemView { name: string; description: string | null; priceMad: number | null; soldOut: boolean; allergens: string[] }
export interface MenuView { place: Ref & { section: PlaceSection }; categories: { name: string; items: MenuItemView[] }[]; locales: Locale[]; indexableLocales: Locale[] }

export interface DishSummary { slug: string; name: string; summary: string | null; indexable?: boolean }
export interface DishDetail extends DishSummary { content: string | null; photos: PhotoView[]; ingredients: string[]; region: Ref | null; places: PlaceSummary[]; locales: Locale[] }

export interface GuideSummary { slug: string; name: string; summary: string | null; indexable?: boolean }
export interface GuideDetail extends GuideSummary {
  photos: PhotoView[];
  content: string | null;
  author: string | null;
  places: PlaceSummary[];
  dishes: Ref[];
  cities: Ref[];
  neighborhoods: (Ref & { city: string })[];
  locales: Locale[];
}

export interface CitySummary { slug: string; name: string; summary: string | null; indexable?: boolean }
export interface CityDetail extends CitySummary { content: string | null; photos: PhotoView[]; neighborhoods: Ref[]; places: PlaceSummary[]; locales: Locale[] }
export interface NeighborhoodDetail { slug: string; name: string; summary: string | null; content: string | null; city: Ref; places: PlaceSummary[]; locales: Locale[] }

export type SeoEntity = 'place' | 'dish' | 'guide' | 'city' | 'neighborhood';
/** Idiomas indexables de una ficha y sus textos para buscadores en el idioma pedido. */
export interface SeoInfo { indexableLocales: Locale[]; title: string | null; description: string | null }
/** Una página para el sitemap: su ruta en cada idioma indexable. */
export interface IndexEntry { paths: Partial<Record<Locale, string>>; lastmod: string | null }

export interface PlaceFilter { section?: PlaceSection; citySlug?: string; neighborhoodSlug?: string; limit?: number }

/** Origen de los datos públicos. Implementaciones: Supabase (clave pública + RLS), demostración (solo desarrollo) y vacío. */
export interface ContentSource {
  readonly isDemo: boolean;
  listPlaces(locale: Locale, filter?: PlaceFilter): Promise<PlaceSummary[]>;
  getPlace(locale: Locale, section: PlaceSection, slug: string): Promise<PlaceDetail | null>;
  getMenu(locale: Locale, section: PlaceSection, slug: string): Promise<MenuView | null>;
  listDishes(locale: Locale): Promise<DishSummary[]>;
  getDish(locale: Locale, slug: string): Promise<DishDetail | null>;
  listGuides(locale: Locale): Promise<GuideSummary[]>;
  getGuide(locale: Locale, slug: string): Promise<GuideDetail | null>;
  listCities(locale: Locale): Promise<CitySummary[]>;
  getCity(locale: Locale, slug: string): Promise<CityDetail | null>;
  getNeighborhood(locale: Locale, citySlug: string, slug: string): Promise<NeighborhoodDetail | null>;
  seoInfo(entity: SeoEntity, slug: string, locale: Locale, citySlug?: string): Promise<SeoInfo>;
  listIndexable(): Promise<IndexEntry[]>;
}

/**
 * Horario en jsonb. Formato del panel: {mon: '9:00–13:00', …} → los 7 días con su nombre en el idioma y "Cerrado" si falta.
 * Se aceptan también formatos antiguos: objeto {texto del día: horas} o lista de textos.
 */
export function normalizeOpeningHours(raw: unknown, locale: Locale = 'es'): [string, string][] {
  if (isWeekHours(raw)) return WEEK.map((d) => [DAY_NAMES[locale][d], raw[d]?.trim() || CLOSED[locale]]);
  if (Array.isArray(raw)) return raw.filter((x) => typeof x === 'string' && x.trim()).map((x) => ['', x as string]);
  if (raw && typeof raw === 'object') {
    return Object.entries(raw as Record<string, unknown>)
      .filter(([, v]) => typeof v === 'string' && v.trim())
      .map(([k, v]) => [k, v as string]);
  }
  return [];
}
