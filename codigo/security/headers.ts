/**
 * Cabeceras de seguridad (HTTPS estricto, CSP, HSTS). Las aplica `codigo/frontend/proxy.ts` en cada petición (con nonce).
 * La CSP es un punto de partida: debe probarse con Google Maps real antes de endurecerla o relajarla.
 */
export interface HeaderOptions {
  supabaseUrl?: string;
  scriptNonce?: string;
  /** Solo `next dev`: React necesita eval para depurar. Nunca en producción. */
  dev?: boolean;
  /** Pruebas locales por http (localhost): sin upgrade-insecure-requests, que rompería los recursos. */
  allowInsecureLocal?: boolean;
}

export function buildCsp({ supabaseUrl, scriptNonce, dev, allowInsecureLocal }: HeaderOptions = {}): string {
  const supa = supabaseUrl ? [supabaseUrl, supabaseUrl.replace(/^https:/, 'wss:')] : [];
  const d: Record<string, string[]> = {
    'default-src': ["'self'"],
    'script-src': ["'self'", ...(scriptNonce ? [`'nonce-${scriptNonce}'`] : []), 'https://maps.googleapis.com', ...(dev ? ["'unsafe-eval'"] : [])],
    'style-src': ["'self'", "'unsafe-inline'"],
    'img-src': ["'self'", 'data:', 'blob:', 'https://maps.googleapis.com', 'https://maps.gstatic.com', 'https://*.googleusercontent.com', ...supa.slice(0, 1)],
    'font-src': ["'self'", 'data:'],
    'connect-src': ["'self'", 'https://maps.googleapis.com', ...supa],
    'frame-src': ["'self'", 'https://www.google.com'],
    'worker-src': ["'self'"],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'frame-ancestors': ["'none'"],
  };
  const csp = Object.entries(d).map(([k, v]) => `${k} ${v.join(' ')}`).join('; ');
  return allowInsecureLocal ? csp : `${csp}; upgrade-insecure-requests`;
}

export function securityHeaders(opts: HeaderOptions = {}): { key: string; value: string }[] {
  return [
    { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
    { key: 'Content-Security-Policy', value: buildCsp(opts) },
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    { key: 'Permissions-Policy', value: 'geolocation=(self), camera=(), microphone=(), payment=()' },
    { key: 'X-Frame-Options', value: 'DENY' },
  ];
}
