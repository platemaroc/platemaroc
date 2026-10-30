/**
 * Límite de intentos en memoria (decisión del titular, 30-10-2026): ventana fija por clave. Vale para un único proceso, que es
 * como se despliega la web. Se reinicia al reiniciar el servidor; la capa de Nginx (Fase 7) la complementa.
 */
export interface Limit { max: number; windowMs: number }

export const LIMITS = {
  /** Enlaces de acceso: por IP y por email, para no usar la web para acosar un buzón. */
  authLink: { max: 5, windowMs: 15 * 60_000 },
  /** Códigos de acceso o de verificación en dos pasos: evita probar códigos a ciegas. */
  authCode: { max: 10, windowMs: 15 * 60_000 },
  /** Formularios de usuario. */
  form: { max: 10, windowMs: 60_000 },
} as const satisfies Record<string, Limit>;

const MAX_KEYS = 50_000;
const hits = new Map<string, { count: number; resetAt: number }>();

/** true si se permite. Cuenta el intento. */
export function allow(key: string, limit: Limit, now = Date.now()): boolean {
  const entry = hits.get(key);
  if (!entry || entry.resetAt <= now) {
    if (hits.size >= MAX_KEYS) for (const [k, v] of hits) if (v.resetAt <= now) hits.delete(k);
    if (hits.size >= MAX_KEYS) hits.clear(); // Tope de memoria ante un ataque con muchas IP.
    hits.set(key, { count: 1, resetAt: now + limit.windowMs });
    return true;
  }
  entry.count += 1;
  return entry.count <= limit.max;
}

export const resetLimits = () => hits.clear();

/**
 * IP del cliente. Nginx pone X-Real-IP (config/server-setup); un visitante no puede fijarla porque Nginx la sobrescribe.
 * X-Forwarded-For solo como respaldo, tomando el último valor, el que añade nuestro proxy.
 */
export function clientIp(get: (name: string) => string | null): string {
  return get('x-real-ip')?.trim() || get('x-forwarded-for')?.split(',').pop()?.trim() || 'sin-ip';
}
