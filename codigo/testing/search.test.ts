import assert from 'node:assert/strict';
import { test } from 'node:test';
import { cleanSearchParam, matchesSearch, MAX_SEARCH_LENGTH, normalizeSearch } from '../shared/search.ts';

test('búsqueda: ignora mayúsculas, acentos y signos', () => {
  assert.equal(normalizeSearch('  Café-Hafa, Tánger! '), 'cafe hafa tanger');
  assert.ok(matchesSearch('CAFE', ['Café Hafa']));
  assert.ok(matchesSearch('pâtisserie', ['Patisserie de Fès']));
});

test('búsqueda: exige todas las palabras, en cualquier campo y orden', () => {
  assert.ok(matchesSearch('tanger cafe', ['Café Hafa', null, 'Tánger']));
  assert.equal(matchesSearch('cafe fez', ['Café Hafa', 'Tánger']), false);
});

test('búsqueda: sin texto no filtra', () => {
  assert.ok(matchesSearch('', ['x']));
  assert.ok(matchesSearch(' ¿? ', ['x']));
});

test('búsqueda: parámetro de la URL seguro', () => {
  assert.equal(cleanSearchParam(undefined), '');
  assert.equal(cleanSearchParam(['a', 'b']), '');
  assert.equal(cleanSearchParam('  fez '), 'fez');
  assert.equal(cleanSearchParam('x'.repeat(200)).length, MAX_SEARCH_LENGTH);
});
