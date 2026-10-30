import assert from 'node:assert/strict';
import { test } from 'node:test';
import { applyPlaceFilters, hasFilters, parsePlaceFilters } from '../shared/place-filters.ts';

const place = (name: string, priceRange: number | null, average: number | null, count = 1) => ({ name, priceRange, rating: { average, count } });
const list = [place('Beta', 2, 4.2), place('Alfa', 1, null, 0), place('Gamma', null, 4.8, 3)];
const none = { price: null, minRating: null, sort: 'nombre' as const };

test('filtros: la URL se lee sin confiar en ella', () => {
  const ok = parsePlaceFilters({ tipo: 'restaurantes', precio: '2', valoracion: '4.5', orden: 'valoracion', barrio: 'medina' });
  assert.deepEqual(ok, { section: 'restaurantes', neighborhood: 'medina', price: 2, minRating: 4.5, sort: 'valoracion' });
  const bad = parsePlaceFilters({ tipo: 'hoteles', precio: '9', valoracion: 'x', orden: 'drop', barrio: ['a'] });
  assert.deepEqual(bad, { section: undefined, neighborhood: '', price: null, minRating: null, sort: 'nombre' });
  assert.equal(hasFilters(bad), false);
  assert.equal(hasFilters(ok), true);
});

test('filtros: precio y valoración no suponen datos que faltan', () => {
  assert.deepEqual(applyPlaceFilters(list, { ...none, price: 1 }).map((p) => p.name), ['Alfa']);
  assert.deepEqual(applyPlaceFilters(list, { ...none, minRating: 4 }).map((p) => p.name), ['Beta', 'Gamma']);
  assert.deepEqual(applyPlaceFilters(list, { ...none, minRating: 4.5 }).map((p) => p.name), ['Gamma']);
});

test('orden: mejor valorados primero y los que no tienen reseñas al final', () => {
  assert.deepEqual(applyPlaceFilters(list, { ...none, sort: 'valoracion' }).map((p) => p.name), ['Gamma', 'Beta', 'Alfa']);
  assert.deepEqual(applyPlaceFilters(list, none).map((p) => p.name), ['Beta', 'Alfa', 'Gamma'], 'sin orden, tal como vienen');
});
