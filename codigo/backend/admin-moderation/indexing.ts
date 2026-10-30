import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { LOCALES } from '../../shared/locales.ts';
import { findDuplicates } from '../../base-indexing/similarity.ts';
import { recordAudit } from './audit-writer.ts';
import { panelAudit } from './audit.ts';
import { ENTITIES, type AdminEntity } from './entities.ts';
import { previewGate, translationText } from './gate-preview.ts';

/**
 * Cálculo real de `translations.is_indexable` (Fase 5): evalúa el Quality Gate de cada ficha e idioma y guarda el resultado.
 * Se ejecuta tras cada cambio del panel y con el botón de /admin/indexacion (las verificaciones caducan con el tiempo).
 * Es una pasada completa para que un cambio en una ficha alcance a las relacionadas (ciudad, barrio, guías…).
 * Solo escribe las filas que cambian: así no altera su fecha de actualización.
 */
type Row = Record<string, any>;
const KEYS = ['lugares', 'ciudades', 'barrios', 'platos', 'guias'] as const satisfies readonly AdminEntity[];

async function all(db: SupabaseClient, table: string, cols = '*'): Promise<Row[]> {
  const { data, error } = await db.from(table).select(cols);
  if (error) throw new Error(`${table}: ${error.message}`);
  return (data ?? []) as unknown as Row[];
}

export interface IndexSummary { evaluated: number; indexable: number; changed: number; duplicates: number }

export async function recomputeIndexable(db: SupabaseClient, email: string): Promise<IndexSummary> {
  const [translations, photos, alts, placeDishes, guidePlaces, guideDishes, guideCities, guideHoods] = await Promise.all([
    all(db, 'translations'), all(db, 'photos', 'id,place_id,status'), all(db, 'photo_translations', 'photo_id,locale,alt'),
    all(db, 'place_dishes'), all(db, 'guide_places'), all(db, 'guide_dishes'), all(db, 'guide_cities'), all(db, 'guide_neighborhoods'),
  ]);
  const rows = Object.fromEntries(await Promise.all(KEYS.map(async (k) => [k, await all(db, ENTITIES[k].table)]))) as Record<(typeof KEYS)[number], Row[]>;
  const published = (list: Row[]) => new Set(list.filter((r) => r.status === 'publicado').map((r) => r.id));
  const live = { cities: published(rows.ciudades), hoods: published(rows.barrios), dishes: published(rows.platos), guides: published(rows.guias) };

  // Duplicidad por idioma entre todos los textos publicados.
  const duplicates = new Set<string>();
  for (const locale of LOCALES) {
    const texts = translations.filter((t) => t.locale === locale && t.status === 'publicada').map((t) => ({ id: t.id as string, text: translationText(t) }));
    for (const id of findDuplicates(texts)) duplicates.add(id);
  }

  const wanted = new Map<string, boolean>();
  for (const key of KEYS) {
    const def = ENTITIES[key];
    for (const row of rows[key]) {
      const trs = translations.filter((t) => t.entity_type === def.type && t.entity_id === row.id);
      const relations: Record<string, string[]> =
        key === 'lugares' ? { platos: placeDishes.filter((x) => x.place_id === row.id).map((x) => x.dish_id) }
        : key === 'platos' ? { lugares: placeDishes.filter((x) => x.dish_id === row.id).map((x) => x.place_id) }
        : key === 'guias' ? {
          lugares: guidePlaces.filter((x) => x.guide_id === row.id).map((x) => x.place_id), platos: guideDishes.filter((x) => x.guide_id === row.id).map((x) => x.dish_id),
          ciudades: guideCities.filter((x) => x.guide_id === row.id).map((x) => x.city_id), barrios: guideHoods.filter((x) => x.guide_id === row.id).map((x) => x.neighborhood_id),
        } : {};
      const placePhotos = key === 'lugares' ? photos.filter((p) => p.place_id === row.id).map((p) => ({
        ...p, alts: Object.fromEntries(alts.filter((a) => a.photo_id === p.id).map((a) => [a.locale, a.alt])),
      })) : [];
      const reports = previewGate(key, {
        row, relations, photos: placePhotos,
        translations: Object.fromEntries(trs.map((t) => [t.locale, t])),
        duplicateLocales: LOCALES.filter((l) => { const t = trs.find((x) => x.locale === l); return t && duplicates.has(t.id); }),
        publishedPlaces: key === 'ciudades' ? rows.lugares.filter((p) => p.city_id === row.id && p.status === 'publicado').length
          : key === 'barrios' ? rows.lugares.filter((p) => p.neighborhood_id === row.id && p.status === 'publicado').length : undefined,
        inboundLinks: key === 'lugares'
          ? (live.cities.has(row.city_id) ? 1 : 0) + (live.hoods.has(row.neighborhood_id) ? 1 : 0)
            + guidePlaces.filter((x) => x.place_id === row.id && live.guides.has(x.guide_id)).length
            + placeDishes.filter((x) => x.place_id === row.id && live.dishes.has(x.dish_id)).length
          : undefined,
      });
      for (const r of reports) { const t = trs.find((x) => x.locale === r.locale); if (t) wanted.set(t.id, r.isIndexable); }
    }
  }

  const now = new Date().toISOString();
  const changed = translations.filter((t) => wanted.has(t.id) && wanted.get(t.id) !== t.is_indexable);
  for (const value of [true, false]) {
    const ids = changed.filter((t) => wanted.get(t.id) === value).map((t) => t.id);
    if (ids.length) {
      const { error } = await db.from('translations').update({ is_indexable: value, indexable_checked_at: now }).in('id', ids);
      if (error) throw new Error(error.message);
    }
  }
  if (changed.length) {
    await recordAudit(panelAudit(email, { entidad_tipo: 'config', entidad_id: 'quality-gate', accion: 'recalcular_indexable', valor_nuevo: { cambiadas: changed.length } }));
  }
  return { evaluated: wanted.size, indexable: [...wanted.values()].filter(Boolean).length, changed: changed.length, duplicates: duplicates.size };
}

/** Idiomas de una ficha cuyo texto se parece demasiado a otro publicado (para la vista previa del panel). */
export async function duplicateLocales(db: SupabaseClient, type: string, id: string): Promise<string[]> {
  const translations = await all(db, 'translations', 'id,entity_type,entity_id,locale,status,description,content');
  const out: string[] = [];
  for (const locale of LOCALES) {
    const own = translations.find((t) => t.entity_type === type && t.entity_id === id && t.locale === locale);
    if (!own) continue;
    const others = translations.filter((t) => t.locale === locale && (t.status === 'publicada' || t.id === own.id));
    if (findDuplicates(others.map((t) => ({ id: t.id, text: translationText(t) }))).has(own.id)) out.push(locale);
  }
  return out;
}
