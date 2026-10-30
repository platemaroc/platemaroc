'use server';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { EMAIL_RE, safeNextPath } from '../../../backend/auth/session.ts';
import { allow, clientIp, LIMITS } from '../../../backend/auth/rate-limit.ts';
import { supabasePublicConfig } from '../../../backend/supabase/env.ts';
import { DEFAULT_LOCALE, isLocale, type Locale } from '../../i18n/config.ts';
import { getMessages } from '../../i18n/messages.ts';
import { supabaseForRequest } from '../../lib/supabase-server.ts';

export interface AuthState { status: 'idle' | 'sent' | 'error'; message?: string; email?: string }

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);

/**
 * Dirección a la que vuelve el enlace del email. En local, la del propio servidor; fuera, SIEMPRE la URL configurada
 * (no la cabecera Host, que la puede falsear quien hace la petición). Supabase además solo acepta URLs de su lista.
 */
async function baseUrl(): Promise<string> {
  const h = await headers();
  const host = h.get('host') ?? '';
  if (LOCAL_HOSTS.has(host.replace(/:\d+$/, ''))) return `http://${host}`;
  return (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://platemaroc.com').replace(/\/$/, '');
}

function read(form: FormData) {
  const lang = String(form.get('lang') ?? '');
  const locale: Locale = isLocale(lang) ? lang : DEFAULT_LOCALE;
  return { locale, t: getMessages(locale).auth, email: String(form.get('email') ?? '').trim().toLowerCase(), next: safeNextPath(form.get('next')) };
}

/** Envía el enlace. El alta de cuentas nuevas solo se abre con PUBLIC_SIGNUP_ENABLED=1 (decisión del titular: no en producción hasta tener política de privacidad y SMTP). */
export async function sendLink(_prev: AuthState, form: FormData): Promise<AuthState> {
  const { t, email, next } = read(form);
  const headersList = await headers();
  if (!EMAIL_RE.test(email)) return { status: 'error', message: t.invalidEmail };
  if (!supabasePublicConfig()) return { status: 'error', message: t.notConfigured };
  const ip = clientIp((n) => headersList.get(n));
  if (!allow(`link:ip:${ip}`, LIMITS.authLink) || !allow(`link:mail:${email}`, LIMITS.authLink)) return { status: 'error', message: t.rateLimited, email };
  const supabase = await supabaseForRequest();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: process.env.PUBLIC_SIGNUP_ENABLED === '1', emailRedirectTo: `${await baseUrl()}/auth/callback?next=${encodeURIComponent(next)}` },
  });
  if (error && (error.status === 429 || error.code === 'over_email_send_rate_limit')) return { status: 'error', message: t.rateLimited, email };
  // Mismo mensaje exista o no la cuenta: no se revela qué emails están registrados.
  return { status: 'sent', message: t.sent, email };
}

export async function verifyCode(_prev: AuthState, form: FormData): Promise<AuthState> {
  const { t, email, next } = read(form);
  const headersList = await headers();
  const token = String(form.get('token') ?? '').replace(/\s+/g, '');
  const ip = clientIp((n) => headersList.get(n));
  if (!allow(`code:ip:${ip}`, LIMITS.authCode) || !allow(`code:mail:${email}`, LIMITS.authCode)) return { status: 'error', message: t.rateLimited, email };
  if (!EMAIL_RE.test(email) || !/^\d{6,10}$/.test(token)) return { status: 'error', message: t.invalidCode, email };
  const supabase = await supabaseForRequest();
  const { error } = await supabase.auth.verifyOtp({ email, token, type: 'email' });
  if (error) return { status: 'error', message: t.invalidCode, email };
  redirect(next);
}

export async function signOut(): Promise<void> {
  const supabase = await supabaseForRequest();
  await supabase.auth.signOut();
  redirect('/');
}
