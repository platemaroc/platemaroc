// node --test codigo/testing/price.test.ts
import test from 'node:test';
import assert from 'node:assert/strict';
import { formatPriceMad } from '../shared/price.ts';

test('formato MAD', () => {
  assert.equal(formatPriceMad(120), '120 MAD');
  assert.equal(formatPriceMad(0), '0 MAD');
  assert.equal(formatPriceMad(12.5, 'en'), '12.5 MAD');
});
test('importes ausentes o inválidos: null (precio pendiente)', () => {
  for (const v of [null, undefined, NaN, -1, Infinity]) assert.equal(formatPriceMad(v as never), null);
});

test('menú: el importe se escribe sin moneda, con coma o punto, y nunca negativo', async () => {
  const check = (v: string) => {
    const e: Record<string, string> = {};
    if (!v.trim()) return { value: null, e };
    const s = v.trim().replace(',', '.');
    if (!/^\d{1,8}(\.\d{1,2})?$/.test(s)) e.price_mad = 'x';
    return { value: Number(s), e };
  };
  assert.equal(check('12,50').value, 12.5);
  assert.ok(check('-5').e.price_mad && check('12 EUR').e.price_mad && check('1.234').e.price_mad);
});
