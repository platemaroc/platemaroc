'use client';
import { startTransition, useActionState, type FormEvent, type ReactNode } from 'react';
import type { FormState } from './actions.ts';
import styles from './admin.module.css';

/**
 * Formulario del panel. Se envía con startTransition para que React NO vacíe los campos tras guardar
 * (si hay un error, lo escrito se conserva). Muestra el resultado y los errores por campo con su etiqueta.
 */
export function AdminForm({ action, children, labels = {}, hidden, submit, className, multipart }: {
  action: (prev: FormState, form: FormData) => Promise<FormState>;
  children: ReactNode;
  labels?: Record<string, string>;
  hidden: Record<string, string>;
  submit: string;
  className?: string;
  multipart?: boolean;
}) {
  const [state, dispatch, pending] = useActionState(action, {});
  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget, (e.nativeEvent as SubmitEvent).submitter);
    startTransition(() => dispatch(data));
  };
  const errors = Object.entries(state.errors ?? {});
  return (
    <form onSubmit={onSubmit} className={className ?? styles.form} encType={multipart ? 'multipart/form-data' : undefined} noValidate>
      {Object.entries(hidden).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
      {children}
      {errors.length > 0 && (
        <ul role="alert" className={styles.errors}>
          {errors.map(([field, msg]) => <li key={field}>{field === '_' ? msg : `${labels[field] ?? field}: ${msg}`}</li>)}
        </ul>
      )}
      {state.ok && state.message && <p role="status" className={styles.saved}>{state.message}</p>}
      {submit && <button type="submit" className={styles.primary} disabled={pending}>{pending ? 'Guardando…' : submit}</button>}
    </form>
  );
}

/** Botón que envía un valor (p. ej. el estado de destino) dentro de un AdminForm. */
export function ValueButton({ name, value, children, secondary }: { name: string; value: string; children: ReactNode; secondary?: boolean }) {
  return <button type="submit" name={name} value={value} className={secondary ? styles.secondary : styles.primary}>{children}</button>;
}
