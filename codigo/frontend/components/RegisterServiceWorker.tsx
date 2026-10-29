'use client';
import { useEffect } from 'react';

export interface RegisterServiceWorkerProps {
  /**
   * Se llama cuando hay una versión nueva instalada y en espera. `apply()` la activa; la página se
   * recarga sola al cambiar de controlador. Sin este callback, la versión nueva se activa en la
   * siguiente visita (sin recargas inesperadas).
   */
  onUpdateAvailable?: (apply: () => void) => void;
}

/** Registra /sw.js (docs/10-politica-pwa-conectividad.md). Solo en producción. */
export function RegisterServiceWorker({ onUpdateAvailable }: RegisterServiceWorkerProps) {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;
    if (!('serviceWorker' in navigator)) return;
    let reloading = false;
    const onControllerChange = () => { if (!reloading) { reloading = true; window.location.reload(); } };

    const notify = (reg: ServiceWorkerRegistration) => {
      const waiting = reg.waiting;
      if (waiting && navigator.serviceWorker.controller && onUpdateAvailable) {
        onUpdateAvailable(() => {
          navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);
          waiting.postMessage({ type: 'SKIP_WAITING' });
        });
      }
    };

    navigator.serviceWorker.register('/sw.js', { scope: '/' }).then((reg) => {
      notify(reg);
      reg.addEventListener('updatefound', () => {
        const nw = reg.installing;
        nw?.addEventListener('statechange', () => { if (nw.state === 'installed') notify(reg); });
      });
    }).catch(() => { /* sin SW la web sigue funcionando */ });

    return () => navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
  }, [onUpdateAvailable]);
  return null;
}
