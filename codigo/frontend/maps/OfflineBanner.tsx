'use client';
import type { Locale } from '../../shared/locales';
import { useOnlineStatus } from './useOnlineStatus';

const TEXT: Record<Locale, string> = {
  es: 'Sin conexión. Puedes ver la dirección y las indicaciones en texto.',
  en: 'You are offline. The address and text directions are still available.',
  fr: 'Hors ligne. L’adresse et les indications écrites restent disponibles.',
};

/** Banner sutil y no intrusivo (docs/11 §2). No tapa contenido: ocupa una franja inferior. */
export function OfflineBanner({ locale = 'es' }: { locale?: Locale }) {
  const online = useOnlineStatus();
  if (online) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        left: 8,
        right: 8,
        bottom: 8,
        padding: '8px 12px',
        borderRadius: 8,
        background: 'rgba(30,30,30,.92)',
        color: '#fff',
        fontSize: 14,
        zIndex: 50,
      }}
    >
      {TEXT[locale]}
    </div>
  );
}
