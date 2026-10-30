'use client';
import { startTransition, useActionState, type FormEvent, type ReactNode } from 'react';
import type { UserFormState } from './actions.ts';
import styles from './cuenta.module.css';

/** Formulario del usuario: conserva lo escrito si hay un error (no vacía los campos) y muestra el resultado. */
export function UserForm({ action, hidden, submit, sending, children }: {
  action: (prev: UserFormState, form: FormData) => Promise<UserFormState>;
  hidden: Record<string, string>;
  submit: string;
  sending: string;
  children: ReactNode;
}) {
  const [state, dispatch, pending] = useActionState(action, {});
  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    startTransition(() => dispatch(data));
  };
  return (
    <form onSubmit={onSubmit} className={styles.form} noValidate>
      {Object.entries(hidden).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
      {children}
      {state.error && <p role="alert" className={styles.error}>{state.error}</p>}
      {state.ok && state.message && <p role="status" className={styles.ok}>{state.message}</p>}
      <button type="submit" className={styles.primary} disabled={pending}>{pending ? sending : submit}</button>
    </form>
  );
}
