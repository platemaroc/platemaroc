import { NextResponse, type NextRequest } from 'next/server';
import type { EmailOtpType } from '@supabase/supabase-js';
import { safeNextPath } from '../../../../backend/auth/session.ts';
import { supabaseForRequest } from '../../../lib/supabase-server.ts';

const OTP_TYPES = new Set<EmailOtpType>(['magiclink', 'email', 'signup', 'recovery', 'invite', 'email_change']);

/**
 * Vuelta del enlace del email. Admite los dos formatos de Supabase: `?code=` (PKCE, mismo navegador que pidió el enlace)
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
  if (code) ok = !(await supabase.auth.exchangeCodeForSession(code)).error;
  else if (otpHash && type && OTP_TYPES.has(type)) ok = !(await supabase.auth.verifyOtp({ token_hash: otpHash, type })).error;

  const target = ok ? new URL(next, request.url) : new URL(`/auth/entrar?error=1&next=${encodeURIComponent(next)}`, request.url);
  return NextResponse.redirect(target);
}
