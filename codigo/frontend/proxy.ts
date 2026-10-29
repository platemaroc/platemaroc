import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { securityHeaders } from '../security/headers.ts';
import { supabasePublicConfig } from '../backend/supabase/env.ts';
import { splitLocale } from './i18n/config.ts';

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);
/** Zonas privadas: sesión renovada, sin caché, sin indexar. */
const PRIVATE = /^\/(admin|auth)(\/|$)/;

/**
 * Renueva la sesión de Supabase (cookies) en las zonas privadas. Se valida con el servidor de Auth (getUser).
 * Las páginas públicas no consultan la sesión: así no añaden una llamada de red a cada visita.
 */
async function refreshSession(request: NextRequest) {
  const config = supabasePublicConfig();
  const pending: { name: string; value: string; options: Record<string, unknown> }[] = [];
  const cacheHeaders: Record<string, string> = {};
  if (!config) return { user: null, pending, cacheHeaders };
  const supabase = createServerClient(config.url, config.anonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list, headers) => {
        for (const c of list) { request.cookies.set(c.name, c.value); pending.push(c as (typeof pending)[number]); }
        Object.assign(cacheHeaders, headers);
      },
    },
  });
  const { data } = await supabase.auth.getUser();
  return { user: data.user, pending, cacheHeaders };
}

/**
 * En cada página: CSP con nonce nuevo (Next.js lo añade a sus propios scripts) y cabeceras de seguridad.
 * También pasa el idioma y la ruta a los layouts. No redirige por idioma (maestro §13).
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPrivate = PRIVATE.test(pathname);
  const session = isPrivate ? await refreshSession(request) : null;

  // Comprobación rápida: sin sesión no se entra en /admin. La comprobación real (y la de rol) la hace el layout del panel.
  if (session && !session.user && /^\/admin(\/|$)/.test(pathname)) {
    const login = new URL('/auth/entrar', request.url);
    login.searchParams.set('next', pathname);
    return NextResponse.redirect(login);
  }

  const nonce = btoa(crypto.randomUUID());
  const headers = securityHeaders({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || undefined,
    scriptNonce: nonce,
    dev: process.env.NODE_ENV === 'development',
    allowInsecureLocal: LOCAL_HOSTS.has(request.nextUrl.hostname),
  });
  const csp = headers.find((h) => h.key === 'Content-Security-Policy')!.value;

  // Después de renovar la sesión: así las cookies nuevas llegan también a la página.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', csp);
  requestHeaders.set('x-pathname', pathname);
  const { locale } = splitLocale(pathname);
  if (locale) requestHeaders.set('x-locale', locale);
  else requestHeaders.delete('x-locale');

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  for (const { key, value } of headers) response.headers.set(key, value);
  if (session) {
    for (const c of session.pending) response.cookies.set(c.name, c.value, c.options);
    for (const [k, v] of Object.entries(session.cacheHeaders)) response.headers.set(k, v);
    response.headers.set('Cache-Control', 'private, no-store');
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  }
  return response;
}

export const config = {
  matcher: [
    {
      source: '/((?!_next/static|_next/image|favicon.ico|sw.js).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
};
