import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { recordAudit } from '../admin-moderation/audit-writer.ts';
import { createAdminClient } from '../supabase/server-admin.ts';

/** Derechos del usuario (maestro §10, RGPD y Ley 09-08): exportar y eliminar sus datos. */
export async function exportUserData(db: SupabaseClient, user: { id: string; email: string | null }) {
  const pick = async (table: string, column: string, cols = '*') => (await db.from(table).select(cols).eq(column, user.id)).data ?? [];
  const [profile, reviews, photos, consents] = await Promise.all([pick('profiles', 'id'), pick('reviews', 'user_id'), pick('photos', 'user_id'), pick('consents', 'user_id')]);
  return { exportado: new Date().toISOString(), email: user.email, perfil: profile[0] ?? null, resenas: reviews, fotos: photos, consentimientos: consents };
}

/**
 * Elimina la cuenta: archivos, y al borrar el usuario caen en cascada perfil, reseñas, fotos y consentimientos.
 * La auditoría se conserva sin el email. No se permite a una cuenta administradora: se quedaría la web sin titular.
 */
export async function deleteAccount(db: SupabaseClient, user: { id: string; isAdmin: boolean }): Promise<boolean> {
  if (user.isAdmin) return false;
  const admin = createAdminClient();
  const paths = ((await db.from('photos').select('storage_path').eq('user_id', user.id)).data ?? []).map((p) => p.storage_path as string).filter((p) => p.startsWith(`${user.id}/`));
  if (paths.length) await admin.storage.from('fotos').remove(paths);
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) return false;
  await recordAudit({ actor: 'sistema', origen: 'sistema', entidad_tipo: 'config', entidad_id: `usuario/${user.id}`, accion: 'eliminar_cuenta', motivo: 'Solicitud del propio usuario' });
  return true;
}
