/**
 * Cabeceras de seguridad (HTTPS estricto, CSP, HSTS). Adaptar a next.config cuando exista.
 * La CSP es un punto de partida: debe probarse con Google Maps real antes de endurecerla o relajarla.
 */
export interface HeaderOptions { supabaseUrl?: string; scriptNonce?: string }

export function buildCsp({ supabaseUrl, scriptNonce }: HeaderOptions = {}): string {
  const supa = supabaseUrl ? [supabaseUrl, supabaseUrl.replace(/^https:/, 'wss:')] : [];
  const d: Record<string, string[]> = {
    'default-src': ["'self'"],
    'script-src': ["'self'", ...(scriptNonce ? [`'nonce-${scriptNonce}'`] : []), 'https://maps.googleapis.com'],
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
  return Object.entries(d).map(([k, v]) => `${k} ${v.join(' ')}`).join('; ') + '; upgrade-insecure-requests';
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
