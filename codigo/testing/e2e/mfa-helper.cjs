// Ayuda para las pruebas del panel: da de alta un segundo factor como lo haría la app del móvil (TOTP, RFC 6238).
const crypto = require('crypto');

/** Hora de Supabase: los códigos dependen de la hora exacta y el reloj del equipo puede ir desfasado. */
let offsetMs = 0;
async function syncClock(apiUrl) {
  const r = await fetch(`${apiUrl}/auth/v1/health`);
  offsetMs = Date.parse(r.headers.get('date')) - Date.now();
}

function totp(secret, step = 30) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = '';
  for (const c of secret.replace(/=+$/, '').toUpperCase()) bits += alphabet.indexOf(c).toString(2).padStart(5, '0');
  const key = Buffer.from(bits.match(/.{8}/g).map((b) => parseInt(b, 2)));
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(Math.floor((Date.now() + offsetMs) / 1000 / step)));
  const h = crypto.createHmac('sha1', key).update(counter).digest();
  const o = h[h.length - 1] & 0xf;
  return String((h.readUInt32BE(o) & 0x7fffffff) % 1_000_000).padStart(6, '0');
}

/** Un código no se puede reutilizar: espera al siguiente periodo de 30 segundos. */
const nextCode = () => new Promise((r) => setTimeout(r, 30_000 - ((Date.now() + offsetMs) % 30_000) + 500));

/** Quita los factores de la cuenta de pruebas: cada ejecución empieza de cero. */
async function resetFactors(api, email) {
  const { users } = await api('/auth/v1/admin/users?per_page=200');
  const user = users.find((u) => u.email === email);
  if (!user) return;
  const factors = await api(`/auth/v1/admin/users/${user.id}/factors`);
  for (const f of factors ?? []) await api(`/auth/v1/admin/users/${user.id}/factors/${f.id}`, { method: 'DELETE' });
}

/** Con la sesión ya iniciada: alta del factor en /auth/mfa y verificación. Deja la página en su destino. */
async function passMfa(page) {
  await page.waitForURL(/\/auth\/mfa/, { timeout: 60_000 });
  if (await page.locator('button:has-text("Empezar")').count() || !(await page.locator('[data-testid=totp-secret]').count())) await page.click('button:has-text("Empezar")');
  await page.waitForSelector('[data-testid=totp-secret]', { timeout: 60_000 });
  const secret = (await page.textContent('[data-testid=totp-secret]')).trim();
  await page.fill('#code', totp(secret));
  await page.click('button:has-text("Verificar")');
  await page.waitForURL((u) => !u.pathname.startsWith('/auth/mfa'), { timeout: 30_000 }).catch(async (e) => {
    if (process.env.E2E_SHOT) await page.screenshot({ path: process.env.E2E_SHOT, fullPage: true });
    throw new Error(`Sigue en ${page.url()}: ${(await page.innerText('body')).replace(/\s+/g, ' ').slice(-260)}`, { cause: e });
  });
  return secret;
}

module.exports = { nextCode, totp, resetFactors, passMfa, syncClock };
