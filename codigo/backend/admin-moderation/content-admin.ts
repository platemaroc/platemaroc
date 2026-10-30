import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { LOCALES, type Locale } from '../../shared/locales.ts';
import { canTransition } from '../../shared/states.ts';
import { recordAudit } from './audit-writer.ts';
import { panelAudit } from './audit.ts';
import { ENTITIES, VERIFICATION_STATUSES, type AdminEntity, type EntityDef } from './entities.ts';
import { duplicateLocales } from './indexing.ts';
import {
  checkCoords, checkLines, checkPhone, checkPriceRange, checkSlug, checkTranslation, checkUrl, checkWeekHours, emptyToNull,
  type Errors, type TranslationInput,
} from './validate.ts';

/**
 * Operaciones del panel sobre el contenido. Usan SIEMPRE el cliente con la sesión del administrador: las políticas RLS
 * (is_admin) vuelven a comprobar el permiso en la base de datos. Cada cambio guardado deja su entrada en audit_log.
 * Nunca se borra contenido: solo se cambia de estado (maestro §1 y orden gestionar-contenido).
 */
type Row = Record<string, any>;
type Form = (key: string) => FormDataEntryValue | null;
export type SaveResult = { ok: true; id: string } | { ok: false; errors: Errors };

async function must<T>(q: PromiseLike<{ data: T; error: { message: string; code?: string } | null }>): Promise<T> {
  const { data, error } = await q;
  if (error) throw Object.assign(new Error(error.message), { code: error.code });
  return data;
}

const auditId = (def: EntityDef, id: string) => (def.audit === 'config' ? `${def.table}/${id}` : id);

/* ---------- Lectura ---------- */

export interface ListItem { id: string; slug: string; status: string; title: string | null; extra: string | null; updated_at: string | null }

/** Lista con el título en español (o el slug si aún no lo tiene). */
export async function listEntities(db: SupabaseClient, key: AdminEntity, filter: { status?: string; q?: string } = {}): Promise<ListItem[]> {
  const def = ENTITIES[key];
  let q = db.from(def.table).select('*').order('updated_at', { ascending: false }).limit(500);
  if (filter.status) q = q.eq('status', filter.status);
  const rows = await must(q) as Row[];
  const tr = rows.length ? await must(db.from('translations').select('entity_id,title').eq('entity_type', def.type).eq('locale', 'es').in('entity_id', rows.map((r) => r.id))) as Row[] : [];
  const titles = new Map(tr.map((t) => [t.entity_id, t.title]));
  const needle = filter.q?.trim().toLowerCase();
  return rows
    .map((r) => ({ id: r.id, slug: r.slug, status: r.status, title: titles.get(r.id) ?? null, extra: null, updated_at: r.updated_at ?? null }))
    .filter((r) => !needle || r.slug.includes(needle) || (r.title ?? '').toLowerCase().includes(needle));
}

export interface Option { id: string; label: string }

/** Opciones para selectores y relaciones: título en español y slug. */
export async function options(db: SupabaseClient, key: AdminEntity | 'place_types'): Promise<Option[]> {
  if (key === 'place_types') return ((await must(db.from('place_types').select('id,slug').order('slug'))) as Row[]).map((t) => ({ id: t.id, label: t.slug }));
  const items = await listEntities(db, key);
  if (key === 'barrios') {
    const hoods = (await must(db.from('neighborhoods').select('id,city_id'))) as Row[];
    const cities = new Map((await listEntities(db, 'ciudades')).map((c) => [c.id, c.title ?? c.slug]));
    const cityOf = new Map(hoods.map((h) => [h.id, cities.get(h.city_id) ?? '?']));
    return items.map((i) => ({ id: i.id, label: `${cityOf.get(i.id)} / ${i.title ?? i.slug}` })).sort((a, b) => a.label.localeCompare(b.label));
  }
  return items.map((i) => ({ id: i.id, label: i.title ? `${i.title} (${i.slug})` : i.slug })).sort((a, b) => a.label.localeCompare(b.label));
}

export interface EntityDetail {
  row: Row;
  translations: Partial<Record<Locale, Row>>;
  relations: Record<string, string[]>;
  photos: Row[];
  /** El slug queda fijo una vez publicado (decisión del titular, 29-10-2026). */
  slugLocked: boolean;
}

export async function getEntity(db: SupabaseClient, key: AdminEntity, id: string): Promise<EntityDetail | null> {
  const def = ENTITIES[key];
  const [row] = (await must(db.from(def.table).select('*').eq('id', id).limit(1))) as Row[];
  if (!row) return null;
  const trs = (await must(db.from('translations').select('*').eq('entity_type', def.type).eq('entity_id', id))) as Row[];
  const relations: Record<string, string[]> = {};
  for (const r of def.relations) relations[r.key] = ((await must(db.from(r.table).select(r.otherKey).eq(r.ownKey, id))) as Row[]).map((x) => x[r.otherKey]);
  const photos = def.photoColumn ? (await must(db.from('photos').select('*').eq(def.photoColumn, id).is('review_id', null).order('created_at'))) as Row[] : [];
  if (photos.length) {
    const alts = (await must(db.from('photo_translations').select('*').in('photo_id', photos.map((p) => p.id)))) as Row[];
    for (const p of photos) p.alts = Object.fromEntries(alts.filter((a) => a.photo_id === p.id).map((a) => [a.locale, a.alt]));
  }
  return { row, translations: Object.fromEntries(trs.map((t) => [t.locale, t])), relations, photos, slugLocked: await wasPublished(db, def, row) };
}

/** Publicado ahora, archivado, o publicado alguna vez según la auditoría. */
async function wasPublished(db: SupabaseClient, def: EntityDef, row: Row): Promise<boolean> {
  if (row.status === 'publicado' || row.status === 'archivado') return true;
  const changes = (await must(db.from('audit_log').select('valor_nuevo').eq('entidad_id', auditId(def, row.id)).eq('accion', 'estado'))) as Row[];
  return changes.some((c) => c.valor_nuevo === 'publicado');
}

/* ---------- Campos propios ---------- */

/** Lee y valida los campos de cada tipo. Devuelve solo columnas reales de la tabla. */
async function parseFields(db: SupabaseClient, key: AdminEntity, form: Form, adminEmail: string, current: Row | null): Promise<{ values: Row; errors: Errors }> {
  const errors: Errors = {};
  const values: Row = {};
  if (!current || !(await wasPublished(db, ENTITIES[key], current))) values.slug = checkSlug(form('slug'), errors);
  const uuid = (field: string, required: boolean, label: string) => {
    const v = emptyToNull(form(field));
    if (!v && required) errors[field] = `Elige ${label}.`;
    if (v && !/^[0-9a-f-]{36}$/.test(v)) errors[field] = 'Opción no válida.';
    return v;
  };
  if (key === 'lugares') {
    values.place_type_id = uuid('place_type_id', true, 'el tipo de lugar');
    values.city_id = uuid('city_id', true, 'la ciudad');
    values.neighborhood_id = uuid('neighborhood_id', false, 'el barrio');
    if (values.neighborhood_id && values.city_id) {
      const [hood] = (await must(db.from('neighborhoods').select('city_id').eq('id', values.neighborhood_id).limit(1))) as Row[];
      if (hood?.city_id !== values.city_id) errors.neighborhood_id = 'Ese barrio no es de la ciudad elegida.';
    }
    values.address = emptyToNull(form('address'));
    Object.assign(values, checkCoords(form('lat'), form('lng'), errors));
    values.price_range = checkPriceRange(form('price_range'), errors);
    values.opening_hours = checkWeekHours(form, errors);
    values.phone = checkPhone(form('phone'), errors);
    values.website = checkUrl(form('website'), 'website', errors);
    const vs = String(form('verification_status') ?? 'sin_verificar');
    if (!(VERIFICATION_STATUSES as readonly string[]).includes(vs)) errors.verification_status = 'Estado de verificación no válido.';
    values.verification_status = vs;
    values.verification_source = emptyToNull(form('verification_source'));
    // La fecha de verificación solo cambia si el titular marca que lo ha comprobado hoy (orden gestionar-contenido).
    if (form('verified_today') === 'on') { values.verified_at = new Date().toISOString(); values.verified_by = adminEmail; }
    if (vs === 'verificado' && !values.verification_source) errors.verification_source = 'Indica cómo lo has verificado (visita, llamada, web oficial…).';
    if (vs !== 'sin_verificar' && !values.verified_at && !current?.verified_at) errors.verified_today = 'Marca la casilla de verificado hoy para fijar la fecha.';
  } else if (key === 'ciudades') {
    values.region_id = uuid('region_id', true, 'la región');
    Object.assign(values, checkCoords(form('lat'), form('lng'), errors));
  } else if (key === 'barrios') {
    values.city_id = uuid('city_id', true, 'la ciudad');
    Object.assign(values, checkCoords(form('lat'), form('lng'), errors));
  } else if (key === 'platos') {
    values.origin_region_id = uuid('origin_region_id', false, 'la región');
    const ing = checkLines(form('main_ingredients'));
    values.main_ingredients = ing.length ? ing : null;
  } else if (key === 'guias') {
    values.author_name = emptyToNull(form('author_name'));
  }
  return { values, errors };
}

const same = (a: unknown, b: unknown) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

/** Alta (id = null, entra en borrador) o edición. Registra en la auditoría cada campo que cambia. */
export async function saveFields(db: SupabaseClient, key: AdminEntity, id: string | null, form: Form, adminEmail: string): Promise<SaveResult> {
  const def = ENTITIES[key];
  if (!def.editable) return { ok: false, errors: { _: 'Este tipo no tiene campos editables.' } };
  const current = id ? ((await must(db.from(def.table).select('*').eq('id', id).limit(1))) as Row[])[0] ?? null : null;
  if (id && !current) return { ok: false, errors: { _: 'No existe.' } };
  const { values, errors } = await parseFields(db, key, form, adminEmail, current);
  if (Object.keys(errors).length) return { ok: false, errors };

  try {
    if (!current) {
      const [created] = (await must(db.from(def.table).insert({ ...values, status: 'borrador' }).select('id'))) as Row[];
      await recordAudit(panelAudit(adminEmail, { entidad_tipo: def.audit, entidad_id: auditId(def, created.id), accion: 'crear', valor_nuevo: values }));
      return { ok: true, id: created.id };
    }
    const changed = Object.fromEntries(Object.entries(values).filter(([k, v]) => !same(v, current[k])));
    if (!Object.keys(changed).length) return { ok: true, id: current.id };
    await must(db.from(def.table).update(changed).eq('id', current.id));
    for (const [campo, nuevo] of Object.entries(changed)) {
      await recordAudit(panelAudit(adminEmail, { entidad_tipo: def.audit, entidad_id: auditId(def, current.id), accion: 'editar', campo, valor_anterior: current[campo] ?? null, valor_nuevo: nuevo }));
    }
    return { ok: true, id: current.id };
  } catch (e) {
    if ((e as { code?: string }).code === '23505') return { ok: false, errors: { slug: 'Ya existe otro con ese slug.' } };
    throw e;
  }
}

/* ---------- Traducciones ---------- */

export async function saveTranslation(db: SupabaseClient, key: AdminEntity, id: string, locale: Locale, form: Form, adminEmail: string): Promise<SaveResult> {
  const def = ENTITIES[key];
  if (!LOCALES.includes(locale)) return { ok: false, errors: { _: 'Idioma no válido.' } };
  const parsed = checkTranslation(form, def.place);
  if (!parsed.ok) return parsed;
  const [current] = (await must(db.from('translations').select('*').eq('entity_type', def.type).eq('entity_id', id).eq('locale', locale).limit(1))) as Row[];
  const fields = Object.fromEntries(Object.entries(parsed.value).filter(([k]) => def.place || k !== 'directions')) as Partial<TranslationInput>;
  if ((current?.status === 'revisada' || current?.status === 'publicada') && !fields.title) return { ok: false, errors: { title: 'Una traducción revisada o publicada necesita título.' } };
  const auditKey = `${def.type}/${id}/${locale}`;
  if (!current) {
    await must(db.from('translations').insert({ entity_type: def.type, entity_id: id, locale, ...fields, status: 'borrador' }));
    await recordAudit(panelAudit(adminEmail, { entidad_tipo: 'translation', entidad_id: auditKey, accion: 'crear', valor_nuevo: fields }));
    return { ok: true, id };
  }
  const changed = Object.fromEntries(Object.entries(fields).filter(([k, v]) => !same(v, current[k])));
  if (!Object.keys(changed).length) return { ok: true, id };
  await must(db.from('translations').update(changed).eq('id', current.id));
  for (const [campo, nuevo] of Object.entries(changed)) {
    await recordAudit(panelAudit(adminEmail, { entidad_tipo: 'translation', entidad_id: auditKey, accion: 'editar', campo, valor_anterior: current[campo] ?? null, valor_nuevo: nuevo }));
  }
  return { ok: true, id };
}

/* ---------- Estados ---------- */

export async function changeStatus(db: SupabaseClient, key: AdminEntity, id: string, to: string, adminEmail: string): Promise<SaveResult> {
  const def = ENTITIES[key];
  const [row] = (await must(db.from(def.table).select('id,status').eq('id', id).limit(1))) as Row[];
  if (!row) return { ok: false, errors: { _: 'No existe.' } };
  const check = canTransition('contenido', row.status, to, 'admin');
  if (!check.allowed) return { ok: false, errors: { status: check.reason ?? 'No permitido.' } };
  await must(db.from(def.table).update({ status: to }).eq('id', id));
  await recordAudit(panelAudit(adminEmail, { entidad_tipo: def.audit, entidad_id: auditId(def, id), accion: 'estado', campo: 'status', valor_anterior: row.status, valor_nuevo: to }));
  return { ok: true, id };
}

export async function changeTranslationStatus(db: SupabaseClient, key: AdminEntity, id: string, locale: Locale, to: string, adminEmail: string): Promise<SaveResult> {
  const def = ENTITIES[key];
  const [tr] = (await must(db.from('translations').select('id,status,title').eq('entity_type', def.type).eq('entity_id', id).eq('locale', locale).limit(1))) as Row[];
  if (!tr) return { ok: false, errors: { _: 'Guarda primero el texto de este idioma.' } };
  const check = canTransition('traduccion', tr.status, to, 'admin');
  if (!check.allowed) return { ok: false, errors: { status: check.reason ?? 'No permitido.' } };
  if (to !== 'borrador' && !tr.title?.trim()) return { ok: false, errors: { title: 'Falta el título.' } };
  // Al salir de "publicada" deja de ser indexable (restricción de la tabla).
  await must(db.from('translations').update(to === 'publicada' ? { status: to } : { status: to, is_indexable: false }).eq('id', tr.id));
  await recordAudit(panelAudit(adminEmail, { entidad_tipo: 'translation', entidad_id: `${def.type}/${id}/${locale}`, accion: 'estado', campo: 'status', valor_anterior: tr.status, valor_nuevo: to }));
  return { ok: true, id };
}

/* ---------- Relaciones ---------- */

export async function saveRelations(db: SupabaseClient, key: AdminEntity, id: string, relKey: string, selected: string[], adminEmail: string): Promise<SaveResult> {
  const def = ENTITIES[key];
  const r = def.relations.find((x) => x.key === relKey);
  if (!r) return { ok: false, errors: { _: 'Relación no válida.' } };
  const wanted = [...new Set(selected.filter((x) => /^[0-9a-f-]{36}$/.test(x)))];
  const current = ((await must(db.from(r.table).select(r.otherKey).eq(r.ownKey, id))) as Row[]).map((x) => x[r.otherKey] as string);
  const add = wanted.filter((x) => !current.includes(x));
  const remove = current.filter((x) => !wanted.includes(x));
  if (add.length) await must(db.from(r.table).insert(add.map((other) => ({ [r.ownKey]: id, [r.otherKey]: other }))));
  // Quitar un enlace entre dos fichas no borra contenido: las dos fichas siguen existiendo.
  if (remove.length) await must(db.from(r.table).delete().eq(r.ownKey, id).in(r.otherKey, remove));
  if (add.length || remove.length) {
    await recordAudit(panelAudit(adminEmail, { entidad_tipo: def.audit, entidad_id: auditId(def, id), accion: 'relaciones', campo: r.table, valor_anterior: current, valor_nuevo: wanted }));
  }
  return { ok: true, id };
}

/* ---------- Datos para la vista previa del Quality Gate ---------- */

/** Lugares publicados (ciudad/barrio) y páginas publicadas que enlazan a un lugar (su ciudad, barrio, guías y platos). */
export async function gateExtras(db: SupabaseClient, key: AdminEntity, row: Row): Promise<{ publishedPlaces?: number; inboundLinks?: number; duplicateLocales?: string[] }> {
  const duplicates = key === 'regiones' ? [] : await duplicateLocales(db, ENTITIES[key].type, row.id);
  const count = async (table: string, col: string, ids: string[]) => {
    if (!ids.length) return 0;
    return ((await must(db.from(table).select('id').in(col, ids).eq('status', 'publicado'))) as Row[]).length;
  };
  if (key === 'ciudades' || key === 'barrios') {
    const col = key === 'ciudades' ? 'city_id' : 'neighborhood_id';
    return { duplicateLocales: duplicates, publishedPlaces: ((await must(db.from('places').select('id').eq(col, row.id).eq('status', 'publicado'))) as Row[]).length };
  }
  if (key === 'lugares') {
    const guides = ((await must(db.from('guide_places').select('guide_id').eq('place_id', row.id))) as Row[]).map((x) => x.guide_id);
    const dishes = ((await must(db.from('place_dishes').select('dish_id').eq('place_id', row.id))) as Row[]).map((x) => x.dish_id);
    const inbound = (await count('cities', 'id', row.city_id ? [row.city_id] : [])) + (await count('neighborhoods', 'id', row.neighborhood_id ? [row.neighborhood_id] : []))
      + (await count('guides', 'id', guides)) + (await count('dishes', 'id', dishes));
    return { duplicateLocales: duplicates, inboundLinks: inbound };
  }
  return { duplicateLocales: duplicates };
}
