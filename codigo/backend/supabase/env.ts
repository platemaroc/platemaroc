/**
 * Lectura de las variables de Supabase (nombres en config/env-templates/.env.example; valores solo en .env.local o en el servidor).
 * Devuelve null si faltan: la web arranca sin Supabase mientras el titular no haya creado el proyecto.
 */
export interface SupabasePublicConfig { url: string; anonKey: string }

export function supabasePublicConfig(env: Record<string, string | undefined> = process.env): SupabasePublicConfig | null {
  const url = env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !anonKey) return null;
  if (!/^https:\/\//.test(url)) throw new Error('NEXT_PUBLIC_SUPABASE_URL debe empezar por https://');
  return { url, anonKey };
}

/** Clave secreta: solo para server-admin.ts. Nunca con prefijo NEXT_PUBLIC_. */
export function supabaseServiceRoleKey(env: Record<string, string | undefined> = process.env): string | null {
  return env.SUPABASE_SERVICE_ROLE_KEY?.trim() || null;
}
