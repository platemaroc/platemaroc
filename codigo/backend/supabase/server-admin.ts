import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { supabasePublicConfig, supabaseServiceRoleKey } from './env.ts';

/**
 * Cliente con service_role: se salta RLS. Solo para tareas de servidor autorizadas (auditoría, importación, moderación)
 * y nunca con datos que lleguen sin validar del navegador. `server-only` hace fallar el build si se importa en el cliente.
 */
export function createAdminClient() {
  const config = supabasePublicConfig();
  const serviceRoleKey = supabaseServiceRoleKey();
  if (!config || !serviceRoleKey) throw new Error('Supabase (service_role) no está configurado');
  return createClient(config.url, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
}
