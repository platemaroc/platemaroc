import 'server-only';
import { NextResponse, type NextRequest } from 'next/server';
import { safeNextPath } from '../../backend/auth/session.ts';
import { supabasePublicConfig } from '../../backend/supabase/env.ts';
import { authBaseUrl } from './auth-url.ts';
import { supabaseForRequest } from './supabase-server.ts';

/**
 * Empieza el acceso con Google o Apple. Es una ruta y no un formulario: la CSP (`form-action 'self'`) impediría a un formulario
 * saltar a otro dominio. Supabase devuelve la dirección del proveedor; de vuelta se llega a /auth/callback.
 */
export async function startOAuth(request: NextRequest, provider: 'google' | 'apple') {
  const url = request.nextUrl;
  const next = safeNextPath(url.searchParams.get('next'));
  const failed = new URL(`/auth/entrar?error=1&next=${encodeURIComponent(next)}`, request.url);
  if (!supabasePublicConfig()) return NextResponse.redirect(failed);
  const supabase = await supabaseForRequest();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo: `${await authBaseUrl()}/auth/callback?next=${encodeURIComponent(next)}`, skipBrowserRedirect: true },
  });
  return NextResponse.redirect(!error && data.url ? data.url : failed);
}
