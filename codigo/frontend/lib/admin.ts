import 'server-only';
import { notFound, redirect } from 'next/navigation';
import type { SessionUser } from '../../backend/auth/session.ts';
import { currentUser } from './supabase-server.ts';

/**
 * Guardia del panel: sin sesión → a entrar; con sesión pero sin rol de administración → 404 (no se revela que el panel existe).
 * Llamarla en el layout Y en cada Server Action del panel: una acción se puede invocar sin pasar por la página.
 */
export async function requireAdmin(nextPath = '/admin'): Promise<SessionUser> {
  const user = await currentUser();
  if (!user) redirect(`/auth/entrar?next=${encodeURIComponent(nextPath)}`);
  if (!user.isAdmin) notFound();
  return user;
}
