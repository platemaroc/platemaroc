import 'server-only';
import { headers } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import type { SessionUser } from '../../backend/auth/session.ts';
import { currentUser, supabaseForRequest } from './supabase-server.ts';

/**
 * Guardia del panel: sin sesión → a entrar; con sesión pero sin rol de administración → 404 (no se revela que el panel existe);
 * con rol pero sin el segundo paso → a /auth/mfa. La base de datos exige lo mismo (0130): is_admin() pide aal2.
 * Llamarla en el layout Y en cada Server Action del panel: una acción se puede invocar sin pasar por la página.
 */
export async function requireAdmin(next?: string): Promise<SessionUser> {
  // Tras entrar, a la página pedida (proxy.ts pasa la ruta).
  const nextPath = next ?? (await headers()).get('x-pathname') ?? '/admin';
  const user = await currentUser();
  if (!user) redirect(`/auth/entrar?next=${encodeURIComponent(nextPath)}`);
  if (!user.isAdmin) notFound();
  const { data } = await (await supabaseForRequest()).auth.mfa.getAuthenticatorAssuranceLevel();
  if (data?.currentLevel !== 'aal2') redirect(`/auth/mfa?next=${encodeURIComponent(nextPath)}`);
  return user;
}
