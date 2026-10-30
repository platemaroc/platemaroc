import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { LOCALES } from '../../shared/locales.ts';
import { canTransition } from '../../shared/states.ts';
import { evaluateQualityGate, type GateReport } from '../../base-indexing/quality-gate.ts';
import { recordAudit } from './audit-writer.ts';
import { panelAudit } from './audit.ts';
import type { SaveResult } from './content-admin.ts';
import { checkLines, checkPriceMad, emptyToNull, type Errors } from './validate.ts';

/**
 * Menú digital de un lugar (uno por lugar, decisión del titular). Todo con la sesión del administrador (RLS) y auditoría.
 * Estados de un artículo o categoría: borrador = oculto; revisado = listo; publicado = en la web tras "Publicar menú".
 * Nunca se borra nada: se oculta. Precios solo en MAD (docs/12); un precio no verificado se muestra como pendiente.
 */
type Row = Record<string, any>;
type Form = (key: string) => FormDataEntryValue | null;

const AVAILABILITY = ['disponible', 'agotado', 'desconocida'];

async function must<T>(q: PromiseLike<{ data: T; error: { message: string } | null }>): Promise<T> {
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return data;
}

export interface MenuData { menu: Row | null; categories: Row[]; items: Row[]; names: Record<string, Record<string, Row>> }

export async function getMenuData(db: SupabaseClient, placeId: string): Promise<MenuData> {
  const [menu] = (await must(db.from('menus').select('*').eq('place_id', placeId).order('created_at').limit(1))) as Row[];
  if (!menu) return { menu: null, categories: [], items: [], names: {} };
  const categories = (await must(db.from('menu_categories').select('*').eq('menu_id', menu.id).order('position').order('created_at'))) as Row[];
  const items = categories.length ? (await must(db.from('menu_items').select('*').in('category_id', categories.map((c) => c.id)).order('position').order('created_at'))) as Row[] : [];
  const ids = [...categories, ...items].map((x) => x.id);
  const trs = ids.length ? (await must(db.from('menu_translations').select('*').in('target_id', ids))) as Row[] : [];
  const names: MenuData['names'] = {};
  for (const t of trs) (names[t.target_id] ??= {})[t.locale] = t;
  return { menu, categories, items, names };
}

async function ensureMenu(db: SupabaseClient, placeId: string): Promise<string> {
  const [menu] = (await must(db.from('menus').select('id').eq('place_id', placeId).limit(1))) as Row[];
  if (menu) return menu.id;
  const [created] = (await must(db.from('menus').insert({ place_id: placeId, status: 'borrador' }).select('id'))) as Row[];
  return created.id;
}

/** Nombres y descripciones por idioma. Un idioma vacío no se guarda. */
async function saveNames(db: SupabaseClient, targetType: 'category' | 'item', targetId: string, form: Form): Promise<void> {
  for (const locale of LOCALES) {
    const name = emptyToNull(form(`name_${locale}`));
    const description = targetType === 'item' ? emptyToNull(form(`description_${locale}`)) : null;
    const [current] = (await must(db.from('menu_translations').select('id').eq('target_type', targetType).eq('target_id', targetId).eq('locale', locale).limit(1))) as Row[];
    if (current) await must(db.from('menu_translations').update({ name, description }).eq('id', current.id));
    else if (name) await must(db.from('menu_translations').insert({ target_type: targetType, target_id: targetId, locale, name, description, status: 'borrador' }));
  }
}

export async function saveCategory(db: SupabaseClient, placeId: string, categoryId: string | null, form: Form, email: string): Promise<SaveResult> {
  if (!emptyToNull(form('name_es'))) return { ok: false, errors: { name_es: 'Escribe el nombre en español.' } };
  const position = Number(form('position') ?? 0);
  const menuId = await ensureMenu(db, placeId);
  let id = categoryId;
  if (id) await must(db.from('menu_categories').update({ position: Number.isInteger(position) ? position : 0 }).eq('id', id).eq('menu_id', menuId));
  else id = ((await must(db.from('menu_categories').insert({ menu_id: menuId, position: Number.isInteger(position) ? position : 0, status: 'revisado' }).select('id'))) as Row[])[0].id as string;
  await saveNames(db, 'category', id, form);
  await recordAudit(panelAudit(email, { entidad_tipo: 'menu', entidad_id: menuId, accion: categoryId ? 'editar_categoria' : 'crear_categoria', campo: id }));
  return { ok: true, id: placeId };
}

export async function saveItem(db: SupabaseClient, placeId: string, itemId: string | null, form: Form, email: string): Promise<SaveResult> {
  const errors: Errors = {};
  if (!emptyToNull(form('name_es'))) errors.name_es = 'Escribe el nombre en español.';
  const price_mad = checkPriceMad(form('price_mad'), errors);
  const verified = form('price_verified') === 'on';
  if (verified && price_mad === null && !errors.price_mad) errors.price_mad = 'Un precio verificado necesita importe.';
  const availability = String(form('availability') ?? 'desconocida');
  if (!AVAILABILITY.includes(availability)) errors.availability = 'Disponibilidad no válida.';
  const categoryId = String(form('category_id') ?? '');
  const menuId = await ensureMenu(db, placeId);
  const [category] = (await must(db.from('menu_categories').select('id').eq('id', categoryId).eq('menu_id', menuId).limit(1))) as Row[];
  if (!category) errors._ = 'La categoría no es de este menú.';
  if (Object.keys(errors).length) return { ok: false, errors };
  const allergens = checkLines(form('allergens'));
  const position = Number(form('position') ?? 0);
  const values = { category_id: categoryId, price_mad, price_status: verified ? 'verificado' : 'pendiente', availability, allergens: allergens.length ? allergens : null, position: Number.isInteger(position) ? position : 0 };
  let id = itemId;
  if (id) {
    const [current] = (await must(db.from('menu_items').select('price_mad,price_status').eq('id', id).limit(1))) as Row[];
    await must(db.from('menu_items').update(values).eq('id', id));
    await recordAudit(panelAudit(email, { entidad_tipo: 'menu', entidad_id: menuId, accion: 'editar_articulo', campo: id, valor_anterior: current, valor_nuevo: values }));
  } else {
    id = ((await must(db.from('menu_items').insert({ ...values, status: 'revisado' }).select('id'))) as Row[])[0].id as string;
    await recordAudit(panelAudit(email, { entidad_tipo: 'menu', entidad_id: menuId, accion: 'crear_articulo', campo: id, valor_nuevo: values }));
  }
  await saveNames(db, 'item', id, form);
  return { ok: true, id: placeId };
}

/** Ocultar o mostrar un artículo. Ocultar lo retira de la web al momento; mostrarlo requiere volver a publicar el menú. */
export async function setItemHidden(db: SupabaseClient, placeId: string, itemId: string, hidden: boolean, email: string): Promise<SaveResult> {
  const [item] = (await must(db.from('menu_items').select('id,status').eq('id', itemId).limit(1))) as Row[];
  if (!item) return { ok: false, errors: { _: 'No existe.' } };
  const to = hidden ? 'borrador' : 'revisado';
  if (item.status !== to) await must(db.from('menu_items').update({ status: to }).eq('id', itemId));
  await recordAudit(panelAudit(email, { entidad_tipo: 'menu', entidad_id: placeId, accion: hidden ? 'ocultar_articulo' : 'mostrar_articulo', campo: itemId, valor_anterior: item.status, valor_nuevo: to }));
  return { ok: true, id: placeId };
}

/** Quality Gate del menú por idioma, con las reglas reales (maestro §4.2). */
export function menuGate(data: MenuData, placeStatus: string): GateReport[] {
  const visible = data.items.filter((i) => i.status !== 'borrador');
  return LOCALES.map((locale) => evaluateQualityGate({
    entity: 'menu', locale, status: (data.menu?.status === 'publicado' ? 'publicado' : 'revisado'),
    translationPublished: visible.length > 0 && visible.every((i) => data.names[i.id]?.[locale]?.name),
    // Un menú no lleva texto largo: se cuenta lo escrito en nombres y descripciones.
    descriptionChars: visible.reduce((n, i) => n + (data.names[i.id]?.[locale]?.name?.length ?? 0) + (data.names[i.id]?.[locale]?.description?.length ?? 0), 0),
    duplicateDetected: false, metadataValid: true, // Un menú es una lista de datos: no se compara como texto.
    menu: {
      placePublished: placeStatus === 'publicado',
      categories: data.categories.map((c) => ({ published: true, publishedItems: visible.filter((i) => i.category_id === c.id).length })).filter((c) => c.publishedItems > 0),
      pricesVerifiedOrMarkedPending: true,
    },
  }));
}

/**
 * Publica el menú completo: artículos visibles, sus categorías, el menú y los textos de cada idioma con nombre.
 * Requiere el lugar publicado y que cada categoría publicada tenga al menos un artículo (maestro §4.2).
 */
export async function publishMenu(db: SupabaseClient, placeId: string, email: string): Promise<SaveResult> {
  const [place] = (await must(db.from('places').select('status').eq('id', placeId).limit(1))) as Row[];
  if (place?.status !== 'publicado') return { ok: false, errors: { status: 'Publica primero el lugar.' } };
  const data = await getMenuData(db, placeId);
  if (!data.menu) return { ok: false, errors: { status: 'El menú está vacío.' } };
  const visible = data.items.filter((i) => i.status !== 'borrador');
  const categories = data.categories.filter((c) => visible.some((i) => i.category_id === c.id));
  if (!visible.length) return { ok: false, errors: { status: 'Añade al menos un artículo visible.' } };
  const noName = [...categories, ...visible].filter((x) => !data.names[x.id]?.es?.name);
  if (noName.length) return { ok: false, errors: { status: `Faltan ${noName.length} nombres en español.` } };

  const publish = async (table: string, ids: string[]) => { if (ids.length) await must(db.from(table).update({ status: 'publicado' }).in('id', ids)); };
  const check = canTransition('menu', 'revisado', 'publicado', 'admin');
  if (!check.allowed) return { ok: false, errors: { status: check.reason ?? 'No permitido.' } };
  await publish('menu_items', visible.map((i) => i.id));
  await publish('menu_categories', categories.map((c) => c.id));
  // Una categoría sin artículos visibles no debe quedar publicada.
  const empty = data.categories.filter((c) => !categories.includes(c) && c.status === 'publicado').map((c) => c.id);
  if (empty.length) await must(db.from('menu_categories').update({ status: 'revisado' }).in('id', empty));
  await must(db.from('menus').update({ status: 'publicado' }).eq('id', data.menu.id));
  const trIds = [...categories, ...visible].flatMap((x) => Object.values(data.names[x.id] ?? {}).filter((t) => t.name).map((t) => t.id));
  if (trIds.length) await must(db.from('menu_translations').update({ status: 'publicada' }).in('id', trIds));
  await recordAudit(panelAudit(email, { entidad_tipo: 'menu', entidad_id: data.menu.id, accion: 'estado', campo: 'status', valor_anterior: data.menu.status, valor_nuevo: 'publicado' }));
  return { ok: true, id: placeId };
}

/** Retira el menú de la web sin borrar nada. */
export async function unpublishMenu(db: SupabaseClient, placeId: string, email: string): Promise<SaveResult> {
  const [menu] = (await must(db.from('menus').select('id,status').eq('place_id', placeId).limit(1))) as Row[];
  if (menu?.status !== 'publicado') return { ok: false, errors: { status: 'No está publicado.' } };
  await must(db.from('menus').update({ status: 'revisado' }).eq('id', menu.id));
  await recordAudit(panelAudit(email, { entidad_tipo: 'menu', entidad_id: menu.id, accion: 'estado', campo: 'status', valor_anterior: 'publicado', valor_nuevo: 'revisado' }));
  return { ok: true, id: placeId };
}
