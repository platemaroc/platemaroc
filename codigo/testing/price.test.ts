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
