import 'server-only';
import { createAdminClient } from '../supabase/server-admin.ts';
import { buildAuditEntry, type AuditInput } from './audit.ts';

export { panelAudit } from './audit.ts';

/**
 * Guarda una entrada en audit_log (maestro §7). Es lo único del panel que usa service_role: audit_log no admite
 * escrituras con la sesión del usuario (solo inserción del servicio, y es inmutable).
 * Llamarla DESPUÉS de que el cambio se haya guardado; si falla, el error sube para que la acción no quede sin registro silenciosamente.
 */
export async function recordAudit(input: AuditInput): Promise<void> {
  const entry = buildAuditEntry(input, crypto.randomUUID());
  const { error } = await createAdminClient().from('audit_log').insert(entry);
  if (error) throw new Error(`No se pudo registrar la auditoría: ${error.message}`);
}

