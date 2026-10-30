'use client';
import { useActionState } from 'react';
import { verifyMfa, type MfaState } from './actions.ts';
import styles from '../auth.module.css';

export function MfaForm({ factorId, next }: { factorId: string; next: string }) {
  const [state, action, pending] = useActionState(verifyMfa, {} as MfaState);
  return (
    <form action={action} className={styles.form}>
      <input type="hidden" name="factor_id" value={factorId} />
      <input type="hidden" name="next" value={next} />
      <label htmlFor="code">Código de 6 dígitos</label>
      <input id="code" name="code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required />
      <button type="submit" disabled={pending}>Verificar</button>
      {state.error && <p role="alert" className={styles.error}>{state.error}</p>}
    </form>
  );
}
