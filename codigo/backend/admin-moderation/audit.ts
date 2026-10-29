/** Registro de auditoría (docs/01-documento-maestro-operacion.md §7). */
export const AUDIT_SOURCES = ['panel', 'claude_code', 'importacion', 'sistema'] as const;
export const AUDIT_ENTITIES = ['place', 'dish', 'guide', 'city', 'neighborhood', 'translation', 'review', 'photo', 'menu', 'reservation', 'redirect', 'config'] as const;
export type AuditSource = (typeof AUDIT_SOURCES)[number];
export type AuditEntity = (typeof AUDIT_ENTITIES)[number];

export interface AuditEntry {
  id: string; fecha: string; actor: string; origen: AuditSource;
  entidad_tipo: AuditEntity; entidad_id: string; accion: string; campo: string | null;
  valor_anterior: unknown; valor_nuevo: unknown; motivo: string | null;
  aprobado_por: string | null; fecha_aprobacion: string | null;
}

export type AuditInput = Omit<AuditEntry, 'id' | 'fecha' | 'campo' | 'valor_anterior' | 'valor_nuevo' | 'motivo' | 'aprobado_por' | 'fecha_aprobacion'> &
  Partial<Pick<AuditEntry, 'campo' | 'valor_anterior' | 'valor_nuevo' | 'motivo' | 'aprobado_por' | 'fecha_aprobacion'>>;

/** Valida y completa una entrada. Lanza si falta algo obligatorio. No incluir secretos en valores. */
export function buildAuditEntry(i: AuditInput, id: string, now = new Date()): AuditEntry {
  if (!AUDIT_SOURCES.includes(i.origen)) throw new Error(`origen no válido: ${i.origen}`);
  if (!AUDIT_ENTITIES.includes(i.entidad_tipo)) throw new Error(`entidad no válida: ${i.entidad_tipo}`);
  for (const k of ['actor', 'entidad_id', 'accion'] as const) if (!String(i[k] ?? '').trim()) throw new Error(`falta ${k}`);
  if (i.aprobado_por && !i.fecha_aprobacion) throw new Error('aprobado_por requiere fecha_aprobacion');
  return {
    id, fecha: now.toISOString(), actor: i.actor, origen: i.origen, entidad_tipo: i.entidad_tipo, entidad_id: i.entidad_id,
    accion: i.accion, campo: i.campo ?? null, valor_anterior: i.valor_anterior ?? null, valor_nuevo: i.valor_nuevo ?? null,
    motivo: i.motivo ?? null, aprobado_por: i.aprobado_por ?? null, fecha_aprobacion: i.fecha_aprobacion ?? null,
  };
}

/** Entrada típica del panel: actor = email del administrador, origen = panel, aprobado por él mismo en ese momento. */
export function panelAudit(adminEmail: string, input: Omit<AuditInput, 'actor' | 'origen'>): AuditInput {
  return { actor: adminEmail, origen: 'panel', aprobado_por: input.aprobado_por ?? adminEmail, fecha_aprobacion: input.fecha_aprobacion ?? new Date().toISOString(), ...input };
}
