import assert from 'node:assert/strict';
import { test } from 'node:test';
import { isClosedSignup, NEW_ACCOUNT_MS } from '../backend/auth/session.ts';

const now = Date.parse('2026-10-30T12:00:00Z');
const justNow = new Date(now - 1000).toISOString();
const old = new Date(now - NEW_ACCOUNT_MS - 1000).toISOString();
const google = { provider: 'google' };

test('alta cerrada: se retira la cuenta de Google recién creada', () => {
  assert.equal(isClosedSignup({ id: 'a', app_metadata: google, created_at: justNow }, false, now), true);
});

test('alta abierta: no se retira nada', () => {
  assert.equal(isClosedSignup({ id: 'a', app_metadata: google, created_at: justNow }, true, now), false);
});

test('una cuenta anterior o de email nunca se retira', () => {
  assert.equal(isClosedSignup({ id: 'a', app_metadata: google, created_at: old }, false, now), false);
  assert.equal(isClosedSignup({ id: 'a', app_metadata: { provider: 'email' }, created_at: justNow }, false, now), false);
  assert.equal(isClosedSignup({ id: 'a', app_metadata: google }, false, now), false);
});

test('la administración nunca se retira', () => {
  assert.equal(isClosedSignup({ id: 'a', app_metadata: { ...google, role: 'admin' }, created_at: justNow }, false, now), false);
});
