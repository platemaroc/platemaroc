// node --test codigo/testing/price.test.ts
import test from 'node:test';
import assert from 'node:assert/strict';
import { formatPriceMad } from '../shared/price.ts';
import { checkPriceMad } from '../backend/admin-moderation/validate.ts';

test('formato MAD', () => {
  assert.equal(formatPriceMad(120), '120 MAD');
  assert.equal(formatPriceMad(0), '0 MAD');
  assert.equal(formatPriceMad(12.5, 'en'), '12.5 MAD');
});
test('importes ausentes o inválidos: null (precio pendiente)', () => {
  for (const v of [null, undefined, NaN, -1, Infinity]) assert.equal(formatPriceMad(v as never), null);
});

test('menú: el importe se escribe sin moneda, con coma o punto, y nunca negativo', () => {
  const run = (v: string) => { const e: Record<string, string> = {}; return { value: checkPriceMad(v, e), error: !!e.price_mad }; };
  assert.deepEqual(run('12,50'), { value: 12.5, error: false });
  assert.deepEqual(run('120'), { value: 120, error: false });
  assert.deepEqual(run(''), { value: null, error: false });
  for (const bad of ['-5', '12 EUR', '1.234', 'gratis', '123456789']) assert.equal(run(bad).error, true, bad);
});
