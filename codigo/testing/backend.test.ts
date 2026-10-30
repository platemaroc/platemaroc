// node --test codigo/testing/backend.test.ts
import test from 'node:test';
import assert from 'node:assert/strict';
import { canTransition } from '../shared/states.ts';
import { summarizeApproved } from '../backend/reviews/rating.ts';
import { supabasePublicConfig, supabaseServiceRoleKey } from '../backend/supabase/env.ts';
import { safeNextPath, toSessionUser } from '../backend/auth/session.ts';
import { allow, clientIp, resetLimits } from '../backend/auth/rate-limit.ts';
import { checkDisplayName, checkReview } from '../backend/reviews/validate.ts';
import { buildAuditEntry, panelAudit } from '../backend/admin-moderation/audit.ts';
import { suggestLocale } from '../frontend/i18n/negotiate.ts';
import { splitLocale } from '../frontend/i18n/config.ts';
import { securityHeaders, buildCsp } from '../security/headers.ts';

test('Claude Code no puede publicar, archivar ni despublicar; el titular sí', () => {
  assert.equal(canTransition('contenido', 'revisado', 'publicado', 'claude_code').allowed, false);
  assert.equal(canTransition('contenido', 'publicado', 'revisado', 'claude_code').allowed, false);
  assert.equal(canTransition('contenido', 'publicado', 'archivado', 'claude_code').allowed, false);
  assert.equal(canTransition('contenido', 'revisado', 'publicado', 'titular').allowed, true);
  assert.equal(canTransition('contenido', 'borrador', 'revisado', 'claude_code').allowed, true);
});
test('saltos de estado y rechazo sin motivo no se permiten', () => {
  assert.equal(canTransition('contenido', 'borrador', 'publicado', 'titular').allowed, false);
  assert.equal(canTransition('resena', 'pendiente', 'rechazada', 'claude_code').allowed, false);
  assert.equal(canTransition('resena', 'pendiente', 'rechazada', 'claude_code', { reason: 'spam' }).allowed, true);
  assert.equal(canTransition('resena', 'pendiente', 'aprobada', 'claude_code').allowed, false);
});
test('media solo con reseñas aprobadas', () => {
  assert.deepEqual(summarizeApproved([{ status: 'pendiente', rating: 1 }, { status: 'aprobada', rating: 5 }, { status: 'aprobada', rating: 4 }]), { count: 2, average: 4.5 });
  assert.deepEqual(summarizeApproved([{ status: 'rechazada', rating: 1 }]), { count: 0, average: null });
});
test('auditoría: campos obligatorios y orígenes válidos', () => {
  const base = { actor: 'claude', origen: 'claude_code', entidad_tipo: 'review', entidad_id: '1', accion: 'proponer_rechazo' } as const;
  assert.equal(buildAuditEntry(base, 'a1').motivo, null);
  assert.throws(() => buildAuditEntry({ ...base, origen: 'otro' as never }, 'a2'));
  assert.throws(() => buildAuditEntry({ ...base, aprobado_por: 'titular' }, 'a3'));
});
test('i18n: sugerencia y prefijos; árabe no es un idioma', () => {
  assert.equal(suggestLocale('fr-FR,fr;q=0.9,en;q=0.8'), 'fr');
  assert.equal(suggestLocale('ar-MA,ar;q=0.9'), null);
  assert.equal(suggestLocale('de, en;q=0.5'), 'en');
  assert.deepEqual(splitLocale('/ar/x'), { locale: null, rest: 'ar/x' });
  assert.deepEqual(splitLocale('/es/restaurantes/a'), { locale: 'es', rest: 'restaurantes/a' });
});
test('cabeceras: HSTS y CSP sin unsafe-eval ni frames externos de terceros', () => {
  const h = Object.fromEntries(securityHeaders({ supabaseUrl: 'https://x.supabase.co' }).map((x) => [x.key, x.value]));
  assert.ok(h['Strict-Transport-Security'].includes('max-age=31536000'));
  assert.ok(!buildCsp().includes('unsafe-eval')); assert.ok(h['Content-Security-Policy'].includes("frame-ancestors 'none'"));
});

test('CSP: unsafe-eval solo en desarrollo; upgrade-insecure-requests salvo en localhost', () => {
  assert.ok(buildCsp({ dev: true }).includes("'unsafe-eval'"));
  assert.ok(buildCsp().endsWith('upgrade-insecure-requests'));
  assert.ok(!buildCsp({ allowInsecureLocal: true }).includes('upgrade-insecure-requests'));
  assert.ok(buildCsp({ scriptNonce: 'abc' }).includes("'nonce-abc'"));
});

test('Supabase: sin variables no hay configuración; la URL debe ser https', () => {
  assert.equal(supabasePublicConfig({}), null);
  assert.equal(supabasePublicConfig({ NEXT_PUBLIC_SUPABASE_URL: 'https://x.supabase.co', NEXT_PUBLIC_SUPABASE_ANON_KEY: ' ' }), null);
  assert.deepEqual(supabasePublicConfig({ NEXT_PUBLIC_SUPABASE_URL: 'https://x.supabase.co', NEXT_PUBLIC_SUPABASE_ANON_KEY: 'k' }), { url: 'https://x.supabase.co', anonKey: 'k' });
  assert.throws(() => supabasePublicConfig({ NEXT_PUBLIC_SUPABASE_URL: 'http://x.supabase.co', NEXT_PUBLIC_SUPABASE_ANON_KEY: 'k' }));
  assert.equal(supabaseServiceRoleKey({}), null);
});

test('sesión: el rol de administración solo sale de app_metadata, nunca de user_metadata', () => {
  assert.equal(toSessionUser({ id: 'u', app_metadata: { role: 'admin' } })?.isAdmin, true);
  assert.equal(toSessionUser({ id: 'u', app_metadata: {}, user_metadata: { role: 'admin' } } as never)?.isAdmin, false);
  assert.equal(toSessionUser(null), null);
});

test('destino tras entrar: solo rutas internas (sin redirecciones abiertas)', () => {
  assert.equal(safeNextPath('/admin?x=1'), '/admin?x=1');
  for (const bad of ['//evil.com', 'https://evil.com', '/\evil.com', 'admin', '', null, '/%5Cevil.com']) {
    const out = safeNextPath(bad);
    assert.ok(out.startsWith('/') && !out.startsWith('//') && !out.includes('evil.com/'), `${String(bad)} → ${out}`);
  }
  assert.equal(safeNextPath('//evil.com'), '/');
});

test('auditoría del panel: actor, origen panel y aprobación con fecha', () => {
  const e = buildAuditEntry(panelAudit('titular@example.com', { entidad_tipo: 'place', entidad_id: 'p1', accion: 'publicar' }), 'id1');
  assert.equal(e.origen, 'panel');
  assert.equal(e.actor, 'titular@example.com');
  assert.ok(e.aprobado_por && e.fecha_aprobacion);
});

test('reseña: valida estrellas, longitud y fecha; nombre visible sin email ni teléfono', () => {
  const f = (v: Record<string, string>) => (k: string) => v[k] ?? null;
  const today = new Date('2026-10-30T12:00:00Z');
  assert.deepEqual(checkReview(f({ rating: '5', lang: 'fr', visited_on: '2026-10-01' }), today).value, { rating: 5, comment: null, locale: 'fr', visited_on: '2026-10-01' });
  assert.deepEqual(checkReview(f({ rating: '6' }), today).errors, ['rating']);
  assert.deepEqual(checkReview(f({ rating: '4', comment: 'x'.repeat(2001) }), today).errors, ['comment']);
  assert.deepEqual(checkReview(f({ rating: '4', visited_on: '2030-01-01' }), today).errors, ['visited_on']);
  assert.equal(checkDisplayName('  Ana   López '), 'Ana López');
  for (const bad of ['a', 'yo@correo.com', 'Tel 0612345678', 'x'.repeat(41)]) assert.equal(checkDisplayName(bad), null, bad);
});

test('límite de intentos: corta al superar el máximo, se recupera y separa claves', () => {
  resetLimits();
  const l = { max: 2, windowMs: 1000 };
  assert.equal(allow('a', l, 0), true);
  assert.equal(allow('a', l, 1), true);
  assert.equal(allow('a', l, 2), false);
  assert.equal(allow('b', l, 2), true);
  assert.equal(allow('a', l, 1001), true);
  assert.equal(clientIp((n) => (n === 'x-real-ip' ? '1.2.3.4' : 'falsa')), '1.2.3.4');
  assert.equal(clientIp((n) => (n === 'x-forwarded-for' ? 'falsa, 5.6.7.8' : null)), '5.6.7.8');
});
