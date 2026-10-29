import 'server-only';
import { cookies } from 'next/headers';
import { createUserClient } from '../../backend/supabase/server.ts';
import { toSessionUser, type SessionUser } from '../../backend/auth/session.ts';

/** Cliente de Supabase con la sesión del usuario de esta petición (cookies). Las políticas RLS deciden qué puede hacer. */
export async function supabaseForRequest() {
  const store = await cookies();
  return createUserClient({
    getAll: () => store.getAll(),
    setAll: (list) => {
      try {
        for (const { name, value, options } of list) store.set(name, value, options);
      } catch {
        // En un Server Component no se pueden escribir cookies: la sesión la renueva proxy.ts.
      }
    },
  });
}

/** Usuario de la sesión, validado con el servidor de Auth (getUser, no solo la cookie). */
export async function currentUser(): Promise<SessionUser | null> {
  const supabase = await supabaseForRequest();
  const { data } = await supabase.auth.getUser();
  return toSessionUser(data.user);
}
