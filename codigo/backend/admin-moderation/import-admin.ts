import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { recordAudit } from './audit-writer.ts';
import { validateCsv, type ImportContext, type ImportReport } from './csv-import.ts';
import { slugify } from './validate.ts';

type Row = Record<string, any>;

async function context(db: SupabaseClient): Promise<ImportContext> {
  const q = async (table: string, cols: string) => { const { data, error } = await db.from(table).select(cols); if (error) throw new Error(error.message); return (data ?? []) as unknown as Row[]; };
  const [types, cities, hoods, places, trs] = await Promise.all([
    q('place_types', 'id,slug'), q('cities', 'id,slug'), q('neighborhoods', 'id,slug,city_id'), q('places', 'slug'),
    db.from('translations').select('entity_id,title').in('entity_type', ['city', 'neighborhood']).then(({ data, error }) => { if (error) throw new Error(error.message); return (data ?? []) as Row[]; }),
  ]);
  const titles = (id: string) => trs.filter((t) => t.entity_id === id && t.title).map((t) => slugify(t.title));
  // El tipo se puede escribir como en la web: "Restaurantes", "Cafés y teterías", "Mercados y zocos"…
  return {
    types: types.map((t) => ({ id: t.id, keys: [t.slug] })),
    cities: cities.map((c) => ({ id: c.id, keys: [c.slug, ...titles(c.id)] })),
    neighborhoods: hoods.map((n) => ({ id: n.id, city_id: n.city_id, keys: [n.slug, ...titles(n.id)] })),
    existingSlugs: new Set(places.map((p) => p.slug)),
  };
}

export async function previewImport(db: SupabaseClient, text: string): Promise<ImportReport> {
  return validateCsv(text, await context(db));
}

/** Se revalida al confirmar: nunca se confía en la vista previa. Todo entra en borrador, con el nombre como título en español. */
export async function runImport(db: SupabaseClient, text: string, adminEmail: string): Promise<{ created: number; report: ImportReport }> {
  const report = await previewImport(db, text);
  if (report.fatal || !report.rows.length) return { created: 0, report };
  const { data, error } = await db.from('places').insert(report.rows.map((r) => r.values)).select('id,slug');
  if (error) throw new Error(error.message);
  const ids = new Map((data ?? []).map((p) => [p.slug, p.id]));
  const tr = await db.from('translations').insert(report.rows.map((r) => ({ entity_type: 'place', entity_id: ids.get(r.slug), locale: 'es', title: r.name, status: 'borrador' })));
  if (tr.error) throw new Error(tr.error.message);
  await recordAudit({
    actor: adminEmail, origen: 'importacion', entidad_tipo: 'place', entidad_id: `importacion/${crypto.randomUUID()}`, accion: 'importar',
    valor_nuevo: { creados: report.rows.length, slugs: report.rows.map((r) => r.slug).slice(0, 200), duplicados: report.duplicates.length, errores: report.errors.length },
    aprobado_por: adminEmail, fecha_aprobacion: new Date().toISOString(),
  });
  return { created: report.rows.length, report };
}
