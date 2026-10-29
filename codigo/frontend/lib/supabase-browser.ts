'use client';
import { createBrowserClient } from '@supabase/ssr';

/** Cliente de navegador: SOLO clave pública (anon). Las políticas RLS protegen los datos; nunca usar service_role aquí. */
export function createSupabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) throw new Error('Supabase no está configurado');
  return createBrowserClient(url, anonKey);
}
