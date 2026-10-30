import { NextResponse, type NextRequest } from 'next/server';
import type { EmailOtpType } from '@supabase/supabase-js';
import { isClosedSignup, safeNextPath } from '../../../../backend/auth/session.ts';
import { createAdminClient } from '../../../../backend/supabase/server-admin.ts';
import { supabaseForRequest } from '../../../lib/supabase-server.ts';

const OTP_TYPES = new Set<EmailOtpType>(['magiclink', 'email', 'signup', 'recovery', 'invite', 'email_change']);

/**
 * Vuelta del acceso con Google (`?code=`, PKCE, mismo navegador). La web ya no envía enlaces por email; `?token_hash=` solo lo usan
 * las pruebas E2E, con enlaces generados por la API de administración del proyecto de pruebas.
 * y `?token_hash=&type=` (plantilla de email personalizada). Solo redirige a rutas internas.
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const next = safeNextPath(url.searchParams.get('next'));
  const code = url.searchParams.get('code');
  const otpHash = url.searchParams.get('token_hash');
  const type = url.searchParams.get('type') as EmailOtpType | null;
  const supabase = await supabaseForRequest();

  let ok = false;
  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    ok = !error;
    // Google no tiene "no crear usuario": con el alta cerrada, la cuenta recién creada se retira al momento.
    if (data.user && isClosedSignup(data.user, process.env.PUBLIC_SIGNUP_ENABLED === '1')) {
      await supabase.auth.signOut();
      await createAdminClient().auth.admin.deleteUser(data.user.id);
      return NextResponse.redirect(new URL(`/auth/entrar?error=cerrado&next=${encodeURIComponent(next)}`, request.url));
    }
  } else if (otpHash && type && OTP_TYPES.has(type)) ok = !(await supabase.auth.verifyOtp({ token_hash: otpHash, type })).error;

  const target = ok ? new URL(next, request.url) : new URL(`/auth/entrar?error=1&next=${encodeURIComponent(next)}`, request.url);
  return NextResponse.redirect(target);
}
