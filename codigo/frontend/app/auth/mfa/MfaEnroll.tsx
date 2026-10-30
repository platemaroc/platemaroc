'use client';
import { useState, useTransition } from 'react';
import { startEnroll, type EnrollData } from './actions.ts';
import { MfaForm } from './MfaForm.tsx';
import styles from '../auth.module.css';

/**
 * Alta del factor. Se guarda aquí, en el navegador: al fallar un código la página se vuelve a pintar,
 * y si el alta se hiciera al pintar, el QR ya escaneado dejaría de valer.
 */
export function MfaEnroll({ next }: { next: string }) {
  const [data, setData] = useState<EnrollData | null>(null);
  const [failed, setFailed] = useState(false);
  const [pending, start] = useTransition();
  if (!data) {
    return (
      <div className={styles.form}>
        <button type="button" disabled={pending} onClick={() => start(async () => { const d = await startEnroll(); setFailed(!d); setData(d); })}>Empezar</button>
        {failed && <p role="alert" className={styles.error}>No se ha podido iniciar el alta. Inténtalo de nuevo.</p>}
      </div>
    );
  }
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={data.qr} alt="Código QR para la app de autenticación" width={220} height={220} />
      <p>O escribe esta clave a mano: <code data-testid="totp-secret">{data.secret}</code></p>
      <MfaForm factorId={data.id} next={next} />
    </>
  );
}
