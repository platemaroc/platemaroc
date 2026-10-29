import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { LOCALES, type Locale } from '../../shared/locales.ts';
import { isPlaceSection, type PlaceSection } from '../../shared/routes.ts';
import { summarizeApproved } from '../reviews/rating.ts';
import type { SupabasePublicConfig } from '../supabase/env.ts';
import {
  normalizeOpeningHours, type CityDetail, type CitySummary, type ContentSource, type DishDetail, type DishSummary, type GuideDetail,
  type GuideSummary, type MenuView, type NeighborhoodDetail, type PhotoView, type PlaceDetail, type PlaceFilter, type PlaceSummary,
  type RatingView, type Ref,
} from './types.ts';

const mediaSrc = (path: string) => `/media/${path.split('/').map(encodeURIComponent).join('/')}`;

type Entity = 'region' | 'city' | 'neighborhood' | 'place' | 'dish' | 'guide';
type Row = Record<string, any>;
interface Tr { title: string; description: string | null; content: string | null; directions: string | null }

/**
 * Contenido público desde Supabase con la clave PÚBLICA: las políticas RLS ya filtran lo publicado (y en cascada).
 * Aun así se filtra por estado de traducción, por si algún día se usa con otra clave.
 */
export function supabaseSource(config: SupabasePublicConfig): ContentSource {
  const db: SupabaseClient = createClient(config.url, config.anonKey, { auth: { persistSession: false, autoRefreshToken: false } });

  async function rows(query: PromiseLike<{ data: Row[] | null; error: { message: string } | null }>): Promise<Row[]> {
    const { data, error } = await query;
    if (error) throw new Error(`Supabase: ${error.message}`);
    return data ?? [];
  }

  async function translations(type: Entity, ids: string[], locale: Locale): Promise<Map<string, Tr>> {
    if (!ids.length) return new Map();
    const data = await rows(db.from('translations').select('*').eq('entity_type', type).eq('locale', locale).eq('status', 'publicada').in('entity_id', ids));
    return new Map(data.filter((t) => t.title?.trim()).map((t) => [t.entity_id, {
      title: t.title, description: t.description ?? null, content: t.content ?? null, directions: t.directions ?? null,
    }]));
  }

  async function publishedLocales(type: Entity, id: string): Promise<Locale[]> {
    const data = await rows(db.from('translations').select('locale,title').eq('entity_type', type).eq('entity_id', id).eq('status', 'publicada'));
    const set = new Set(data.filter((t) => t.title?.trim()).map((t) => t.locale));
    return LOCALES.filter((l) => set.has(l));
  }

  async function refs(table: string, type: Entity, ids: string[], locale: Locale): Promise<Map<string, Ref>> {
    const unique = [...new Set(ids.filter(Boolean))];
    if (!unique.length) return new Map();
    const [data, tr] = await Promise.all([rows(db.from(table).select('id,slug').in('id', unique)), translations(type, unique, locale)]);
    return new Map(data.filter((r) => tr.has(r.id)).map((r) => [r.id, { slug: r.slug, name: tr.get(r.id)!.title }]));
  }

  async function placeTypes(): Promise<Map<string, string>> {
    return new Map((await rows(db.from('place_types').select('id,slug'))).map((t) => [t.id, t.slug]));
  }

  async function ratings(placeIds: string[]): Promise<Map<string, RatingView>> {
    if (!placeIds.length) return new Map();
    const data = await rows(db.from('reviews').select('place_id,rating,status').in('place_id', placeIds));
    return new Map(placeIds.map((id) => [id, summarizeApproved(data.filter((r) => r.place_id === id).map((r) => ({ status: r.status, rating: r.rating })))]));
  }

  async function photos(placeIds: string[], locale: Locale, fallbackAlt: Map<string, string>): Promise<Map<string, PhotoView[]>> {
    if (!placeIds.length) return new Map();
    const list = await rows(db.from('photos').select('id,place_id,storage_path,created_at').in('place_id', placeIds).order('created_at'));
    const alts = list.length
      ? new Map((await rows(db.from('photo_translations').select('photo_id,alt').eq('locale', locale).in('photo_id', list.map((p) => p.id)))).map((a) => [a.photo_id, a.alt]))
      : new Map();
    const out = new Map<string, PhotoView[]>();
    for (const p of list) {
      const view = { src: mediaSrc(p.storage_path), alt: alts.get(p.id) ?? fallbackAlt.get(p.place_id) ?? '' };
      out.set(p.place_id, [...(out.get(p.place_id) ?? []), view]);
    }
    return out;
  }

  async function summaries(placeRows: Row[], locale: Locale): Promise<PlaceSummary[]> {
    if (!placeRows.length) return [];
    const ids = placeRows.map((p) => p.id);
    const [types, tr, cities, hoods, rate] = await Promise.all([
      placeTypes(), translations('place', ids, locale),
      refs('cities', 'city', placeRows.map((p) => p.city_id), locale),
      refs('neighborhoods', 'neighborhood', placeRows.map((p) => p.neighborhood_id), locale),
      ratings(ids),
    ]);
    const pics = await photos(ids, locale, new Map([...tr].map(([id, t]) => [id, t.title])));
    return placeRows.flatMap((p) => {
      const section = types.get(p.place_type_id);
      const t = tr.get(p.id);
      if (!t || !section || !isPlaceSection(section as PlaceSection)) return [];
      return [{
        slug: p.slug, section: section as PlaceSection, name: t.title, summary: t.description,
        city: cities.get(p.city_id) ?? null, neighborhood: hoods.get(p.neighborhood_id) ?? null,
        priceRange: p.price_range ?? null, rating: rate.get(p.id) ?? { count: 0, average: null }, photo: pics.get(p.id)?.[0] ?? null,
      }];
    });
  }

  async function idBySlug(table: string, slug: string, extra?: [string, string]): Promise<string | null> {
    let q = db.from(table).select('id').eq('slug', slug);
    if (extra) q = q.eq(extra[0], extra[1]);
    return (await rows(q.limit(1)))[0]?.id ?? null;
  }

  async function placeRow(section: PlaceSection, slug: string): Promise<Row | null> {
    const [row] = await rows(db.from('places').select('*').eq('slug', slug).limit(1));
    if (!row) return null;
    return (await placeTypes()).get(row.place_type_id) === section ? row : null;
  }

  async function listPlaces(locale: Locale, filter: PlaceFilter = {}): Promise<PlaceSummary[]> {
    let q = db.from('places').select('*').order('slug');
    if (filter.section) {
      const typeId = await idBySlug('place_types', filter.section);
      if (!typeId) return [];
      q = q.eq('place_type_id', typeId);
    }
    if (filter.citySlug) {
      const cityId = await idBySlug('cities', filter.citySlug);
      if (!cityId) return [];
      q = q.eq('city_id', cityId);
      if (filter.neighborhoodSlug) {
        const hoodId = await idBySlug('neighborhoods', filter.neighborhoodSlug, ['city_id', cityId]);
        if (!hoodId) return [];
        q = q.eq('neighborhood_id', hoodId);
      }
    }
    if (filter.limit) q = q.limit(filter.limit);
    return summaries(await rows(q), locale);
  }

  async function placesByIds(ids: string[], locale: Locale): Promise<PlaceSummary[]> {
    return ids.length ? summaries(await rows(db.from('places').select('*').in('id', ids).order('slug')), locale) : [];
  }

  async function listSimple(table: string, type: Entity, locale: Locale): Promise<{ slug: string; name: string; summary: string | null }[]> {
    const data = await rows(db.from(table).select('id,slug').order('slug'));
    const tr = await translations(type, data.map((r) => r.id), locale);
    return data.filter((r) => tr.has(r.id)).map((r) => ({ slug: r.slug, name: tr.get(r.id)!.title, summary: tr.get(r.id)!.description }));
  }

  return {
    isDemo: false,
    listPlaces,

    async getPlace(locale, section, slug): Promise<PlaceDetail | null> {
      const row = await placeRow(section, slug);
      if (!row) return null;
      const [summary] = await summaries([row], locale);
      if (!summary) return null;
      const [tr, locales, dishLinks, menus] = await Promise.all([
        translations('place', [row.id], locale), publishedLocales('place', row.id),
        rows(db.from('place_dishes').select('dish_id').eq('place_id', row.id)), rows(db.from('menus').select('id').eq('place_id', row.id).limit(1)),
      ]);
      const dishes = await refs('dishes', 'dish', dishLinks.map((d) => d.dish_id), locale);
      const pics = await photos([row.id], locale, new Map([[row.id, summary.name]]));
      return {
        ...summary, content: tr.get(row.id)?.content ?? null, directions: tr.get(row.id)?.directions ?? null,
        lat: row.lat === null ? null : Number(row.lat), lng: row.lng === null ? null : Number(row.lng), address: row.address ?? null,
        staticMapSrc: row.static_map_path ? mediaSrc(row.static_map_path) : null,
        openingHours: normalizeOpeningHours(row.opening_hours, locale), phone: row.phone ?? null, website: row.website ?? null,
        dishes: [...dishes.values()], hasMenu: menus.length > 0, photos: pics.get(row.id) ?? [], locales,
      };
    },

    async getMenu(locale, section, slug): Promise<MenuView | null> {
      const row = await placeRow(section, slug);
      if (!row) return null;
      const placeTr = (await translations('place', [row.id], locale)).get(row.id);
      const [menu] = await rows(db.from('menus').select('id').eq('place_id', row.id).limit(1));
      if (!placeTr || !menu) return null;
      const cats = await rows(db.from('menu_categories').select('id,position').eq('menu_id', menu.id).order('position'));
      const items = cats.length ? await rows(db.from('menu_items').select('*').in('category_id', cats.map((c) => c.id)).order('position')) : [];
      const names = new Map((await rows(db.from('menu_translations').select('target_id,name,description').eq('locale', locale).eq('status', 'publicada')
        .in('target_id', [...cats, ...items].map((x) => x.id).concat(menu.id)))).filter((t) => t.name?.trim()).map((t) => [t.target_id, t]));
      return {
        place: { slug, name: placeTr.title, section },
        locales: await publishedLocales('place', row.id),
        categories: cats.filter((c) => names.has(c.id)).map((c) => ({
          name: names.get(c.id)!.name,
          items: items.filter((i) => i.category_id === c.id && names.has(i.id)).map((i) => ({
            name: names.get(i.id)!.name, description: names.get(i.id)!.description ?? null,
            priceMad: i.price_mad === null ? null : Number(i.price_mad), soldOut: i.availability === 'agotado', allergens: i.allergens ?? [],
          })),
        })).filter((c) => c.items.length > 0),
      };
    },

    listDishes: (locale): Promise<DishSummary[]> => listSimple('dishes', 'dish', locale),

    async getDish(locale, slug): Promise<DishDetail | null> {
      const [row] = await rows(db.from('dishes').select('*').eq('slug', slug).limit(1));
      if (!row) return null;
      const tr = (await translations('dish', [row.id], locale)).get(row.id);
      if (!tr) return null;
      const [links, locales, region] = await Promise.all([
        rows(db.from('place_dishes').select('place_id').eq('dish_id', row.id)), publishedLocales('dish', row.id),
        refs('regions', 'region', [row.origin_region_id], locale),
      ]);
      return {
        slug, name: tr.title, summary: tr.description, content: tr.content, ingredients: row.main_ingredients ?? [],
        region: region.get(row.origin_region_id) ?? null, places: await placesByIds(links.map((l) => l.place_id), locale), locales,
      };
    },

    listGuides: (locale): Promise<GuideSummary[]> => listSimple('guides', 'guide', locale),

    async getGuide(locale, slug): Promise<GuideDetail | null> {
      const [row] = await rows(db.from('guides').select('*').eq('slug', slug).limit(1));
      if (!row) return null;
      const tr = (await translations('guide', [row.id], locale)).get(row.id);
      if (!tr) return null;
      const [gp, gd, gc, gn, locales] = await Promise.all([
        rows(db.from('guide_places').select('place_id').eq('guide_id', row.id)), rows(db.from('guide_dishes').select('dish_id').eq('guide_id', row.id)),
        rows(db.from('guide_cities').select('city_id').eq('guide_id', row.id)), rows(db.from('guide_neighborhoods').select('neighborhood_id').eq('guide_id', row.id)),
        publishedLocales('guide', row.id),
      ]);
      const hoodRows = gn.length ? await rows(db.from('neighborhoods').select('id,city_id').in('id', gn.map((x) => x.neighborhood_id))) : [];
      const [dishes, cities, hoods, hoodCities] = await Promise.all([
        refs('dishes', 'dish', gd.map((x) => x.dish_id), locale), refs('cities', 'city', gc.map((x) => x.city_id), locale),
        refs('neighborhoods', 'neighborhood', gn.map((x) => x.neighborhood_id), locale), refs('cities', 'city', hoodRows.map((h) => h.city_id), locale),
      ]);
      return {
        slug, name: tr.title, summary: tr.description, content: tr.content, author: row.author_name ?? null,
        places: await placesByIds(gp.map((x) => x.place_id), locale), dishes: [...dishes.values()], cities: [...cities.values()],
        neighborhoods: hoodRows.flatMap((h) => (hoods.has(h.id) && hoodCities.has(h.city_id) ? [{ ...hoods.get(h.id)!, city: hoodCities.get(h.city_id)!.slug }] : [])),
        locales,
      };
    },

    listCities: (locale): Promise<CitySummary[]> => listSimple('cities', 'city', locale),

    async getCity(locale, slug): Promise<CityDetail | null> {
      const [row] = await rows(db.from('cities').select('id,slug').eq('slug', slug).limit(1));
      if (!row) return null;
      const tr = (await translations('city', [row.id], locale)).get(row.id);
      if (!tr) return null;
      const hoodRows = await rows(db.from('neighborhoods').select('id').eq('city_id', row.id).order('slug'));
      const hoods = await refs('neighborhoods', 'neighborhood', hoodRows.map((h) => h.id), locale);
      return {
        slug, name: tr.title, summary: tr.description, content: tr.content, neighborhoods: [...hoods.values()],
        places: await listPlaces(locale, { citySlug: slug }), locales: await publishedLocales('city', row.id),
      };
    },

    async getNeighborhood(locale, citySlug, slug): Promise<NeighborhoodDetail | null> {
      const [city] = await rows(db.from('cities').select('id,slug').eq('slug', citySlug).limit(1));
      if (!city) return null;
      const [row] = await rows(db.from('neighborhoods').select('id,slug').eq('city_id', city.id).eq('slug', slug).limit(1));
      if (!row) return null;
      const [tr, cityTr] = await Promise.all([translations('neighborhood', [row.id], locale), translations('city', [city.id], locale)]);
      if (!tr.has(row.id) || !cityTr.has(city.id)) return null;
      return {
        slug, name: tr.get(row.id)!.title, summary: tr.get(row.id)!.description, content: tr.get(row.id)!.content,
        city: { slug: citySlug, name: cityTr.get(city.id)!.title },
        places: await listPlaces(locale, { citySlug, neighborhoodSlug: slug }), locales: await publishedLocales('neighborhood', row.id),
      };
    },
  };
}
