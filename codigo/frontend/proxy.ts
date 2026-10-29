import { NextResponse, type NextRequest } from 'next/server';
import { securityHeaders } from '../security/headers.ts';
import { splitLocale } from './i18n/config.ts';

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);

/**
 * En cada página: CSP con nonce nuevo (Next.js lo añade a sus propios scripts) y cabeceras de seguridad.
 * También pasa el idioma de la URL al layout raíz para `<html lang>`. No redirige por idioma (maestro §13).
 */
export function proxy(request: NextRequest) {
  const nonce = btoa(crypto.randomUUID());
  const headers = securityHeaders({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || undefined,
    scriptNonce: nonce,
    dev: process.env.NODE_ENV === 'development',
    allowInsecureLocal: LOCAL_HOSTS.has(request.nextUrl.hostname),
  });
  const csp = headers.find((h) => h.key === 'Content-Security-Policy')!.value;

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', csp);
  const { locale } = splitLocale(request.nextUrl.pathname);
  requestHeaders.set('x-pathname', request.nextUrl.pathname);
  if (locale) requestHeaders.set('x-locale', locale);
  else requestHeaders.delete('x-locale');

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  for (const { key, value } of headers) response.headers.set(key, value);
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
