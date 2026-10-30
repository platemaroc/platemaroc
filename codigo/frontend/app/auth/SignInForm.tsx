'use client';
import { useActionState } from 'react';
import type { Locale } from '../../../shared/locales.ts';
import type { Messages } from '../../i18n/messages.ts';
import { sendLink, verifyCode, type AuthState } from './actions.ts';
import styles from './auth.module.css';

const IDLE: AuthState = { status: 'idle' };

export function SignInForm({ locale, next, t, initialError }: { locale: Locale; next: string; t: Messages['auth']; initialError?: string }) {
  const initial: AuthState = initialError ? { status: 'error', message: initialError } : IDLE;
  const [sent, sendAction, sending] = useActionState(sendLink, initial);
  const [verified, verifyAction, verifying] = useActionState(verifyCode, IDLE);
  const email = verified.email ?? sent.email ?? '';

  return (
    <>
      <form action={sendAction} className={styles.form}>
        <input type="hidden" name="lang" value={locale} />
        <input type="hidden" name="next" value={next} />
        <label htmlFor="email">{t.emailLabel}</label>
        <input id="email" name="email" type="email" autoComplete="email" inputMode="email" required defaultValue={email} />
        <button type="submit" disabled={sending}>{t.send}</button>
        {sent.message && <p role={sent.status === 'error' ? 'alert' : 'status'} className={sent.status === 'error' ? styles.error : styles.ok}>{sent.message}</p>}
      </form>

      {(sent.status === 'sent' || verified.status === 'error') && (
        <form action={verifyAction} className={styles.form}>
          <input type="hidden" name="lang" value={locale} />
          <input type="hidden" name="next" value={next} />
          <input type="hidden" name="email" value={email} />
          <label htmlFor="token">{t.codeLabel}</label>
          <input id="token" name="token" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6,10}" required />
          <button type="submit" disabled={verifying}>{t.verify}</button>
          {verified.message && <p role="alert" className={styles.error}>{verified.message}</p>}
        </form>
      )}
    </>
  );
}
