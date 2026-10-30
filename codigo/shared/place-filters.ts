import { PLACE_SECTIONS, type PlaceSection } from './routes.ts';
import { cleanSearchParam } from './search.ts';

/** Filtros de la búsqueda avanzada, leídos de la URL: un valor desconocido se ignora, nunca da error. */
export const MIN_RATINGS = [3, 4, 4.5] as const;
export const PRICE_LEVELS = [1, 2, 3, 4] as const;

export interface PlaceFilters {
  section?: PlaceSection;
  neighborhood: string;
  price: number | null;
  minRating: number | null;
  sort: 'nombre' | 'valoracion';
}

export function parsePlaceFilters(query: Record<string, unknown>): PlaceFilters {
  const tipo = cleanSearchParam(query.tipo);
  const price = Number(cleanSearchParam(query.precio));
  const minRating = Number(cleanSearchParam(query.valoracion));
  return {
    section: PLACE_SECTIONS.find((s) => s === tipo),
    neighborhood: cleanSearchParam(query.barrio),
    price: PRICE_LEVELS.find((p) => p === price) ?? null,
    minRating: MIN_RATINGS.find((r) => r === minRating) ?? null,
    sort: cleanSearchParam(query.orden) === 'valoracion' ? 'valoracion' : 'nombre',
  };
}

/** Hay algo elegido: la página es una búsqueda y no se indexa. */
export const hasFilters = (f: PlaceFilters) => !!(f.section || f.neighborhood || f.price || f.minRating || f.sort !== 'nombre');

interface Filterable { name: string; priceRange: number | null; rating: { average: number | null; count: number } }

/** Sin valoraciones o sin precio conocido, un lugar no pasa ese filtro: nunca se supone un dato. */
export function applyPlaceFilters<T extends Filterable>(places: T[], f: Pick<PlaceFilters, 'price' | 'minRating' | 'sort'>): T[] {
  const list = places.filter((p) => (!f.price || p.priceRange === f.price) && (!f.minRating || (p.rating.average ?? 0) >= f.minRating));
  if (f.sort !== 'valoracion') return list;
  return [...list].sort((a, b) => (b.rating.average ?? -1) - (a.rating.average ?? -1) || b.rating.count - a.rating.count || a.name.localeCompare(b.name));
}
