// node --test codigo/testing/backend.test.ts
import test from 'node:test';
import assert from 'node:assert/strict';
import { canTransition } from '../shared/states.ts';
import { summarizeApproved } from '../backend/reviews/rating.ts';
import { buildAuditEntry } from '../backend/admin-moderation/audit.ts';
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
  assert.equal(canTransition('reserva', 'solicitada', 'confirmada', 'sistema').allowed, true);
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
