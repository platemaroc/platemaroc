/**
 * Sesión y roles (Supabase Auth). El rol de administración vive en app_metadata, que solo puede cambiar el servidor
 * (service_role); user_metadata lo edita el propio usuario y NUNCA sirve para dar permisos.
 * Las políticas RLS comprueban lo mismo con is_admin(): esto es solo para decidir qué pantalla mostrar.
 */
export interface SessionUser { id: string; email: string | null; isAdmin: boolean }

interface AuthUserLike { id: string; email?: string | null; app_metadata?: Record<string, unknown> | null }

export function toSessionUser(user: AuthUserLike | null | undefined): SessionUser | null {
  if (!user?.id) return null;
  return { id: user.id, email: user.email ?? null, isAdmin: user.app_metadata?.role === 'admin' };
}

/**
 * Destino tras iniciar sesión: solo rutas internas. Evita redirecciones abiertas a otros dominios
 * (`//otro.com`, `https://…`, `/\otro.com`).
 */
export function safeNextPath(next: unknown, fallback = '/'): string {
  if (typeof next !== 'string' || !next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\')) return fallback;
  try {
    const url = new URL(next, 'http://x');
    return url.host === 'x' ? `${url.pathname}${url.search}` : fallback;
  } catch {
    return fallback;
  }
}

/** Margen para reconocer una cuenta recién creada: una cuenta anterior nunca se retira, aunque luego se cierre el alta. */
export const NEW_ACCOUNT_MS = 5 * 60_000;

/**
 * Cuenta creada con Google ahora mismo estando cerrada el alta. Una cuenta que ya existía conserva su proveedor original
 * al enlazar Google, así que aquí no entra. La administración nunca se retira.
 */
export function isClosedSignup(user: AuthUserLike & { created_at?: string }, signupOpen: boolean, now = Date.now()): boolean {
  if (signupOpen || user.app_metadata?.role === 'admin' || user.app_metadata?.provider !== 'google' || !user.created_at) return false;
  const age = now - Date.parse(user.created_at);
  return age >= 0 && age < NEW_ACCOUNT_MS;
}
