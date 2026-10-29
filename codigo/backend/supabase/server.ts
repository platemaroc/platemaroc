import 'server-only';
import { createServerClient, type CookieMethodsServer } from '@supabase/ssr';
import { supabasePublicConfig } from './env.ts';

/**
 * Cliente de Supabase con la sesión del usuario (cookies) y la clave pública: las políticas RLS deciden qué ve.
 * El frontend le pasa las cookies de la petición (next/headers), así este módulo no depende de Next.js.
 */
export function createUserClient(cookies: CookieMethodsServer) {
  const config = supabasePublicConfig();
  if (!config) throw new Error('Supabase no está configurado (faltan NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY)');
  return createServerClient(config.url, config.anonKey, { cookies });
}
