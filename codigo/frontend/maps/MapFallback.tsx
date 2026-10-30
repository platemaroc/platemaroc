'use client';
/**
 * Mapa interactivo con carga diferida y fallback (docs/11-protocolo-fallback-mapas.md).
 *
 * Estados: idle → loading → ready | fallback
 *  - idle: placeholder con espacio reservado (sin CLS). NO se llama a `renderInteractive`, así que
 *    el SDK del mapa y sus componentes pesados no entran en el render inicial.
 *  - loading: el usuario llegó visualmente a la sección (IntersectionObserver); se monta el mapa y
 *    ENTONCES empieza el temporizador de 3000 ms.
 *  - ready: el mapa llamó a `onReady`.
 *  - fallback: timeout, `onError`, sin red o sin coordenadas válidas → mapa estático en el mismo espacio.
 * La dirección, las indicaciones y los enlaces (`geo:` + https para iOS) se muestran siempre bajo el mapa.
 *
 * `renderInteractive` debe importar el SDK de forma dinámica (p. ej. `next/dynamic` con `ssr:false`).
 */
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import type { Locale } from '../../shared/locales';
import { useOnlineStatus } from './useOnlineStatus';
import { useNearViewport } from './useNearViewport';

export const MAP_TIMEOUT_MS = 3000;

export interface MapControls {
  /** Llamar cuando el mapa interactivo haya cargado correctamente. */
  onReady: () => void;
  /** Llamar si el mapa interactivo falla (activa el fallback de inmediato). */
  onError: () => void;
}

export interface MapFallbackProps {
  name: string;
  lat: number | null | undefined;
  lng: number | null | undefined;
  address?: string;
  /** Indicaciones de llegada en texto. */
  directionsText?: string;
  /** URL del mapa estático de respaldo (origen pendiente de decisión). */
  staticMapSrc?: string;
  locale?: Locale;
  timeoutMs?: number;
  /** Relación ancho/alto del espacio reservado. */
  aspectRatio?: string;
  /** Margen del observer; '0px' = solo cuando entra en pantalla. */
  rootMargin?: string;
  /** Render del mapa interactivo externo. Solo se invoca cuando empieza la carga. */
  renderInteractive: (controls: MapControls) => ReactNode;
}

type Status = 'idle' | 'loading' | 'ready' | 'fallback';

const TEXT: Record<Locale, { open: string; openWeb: string; address: string; directions: string; staticAlt: (n: string) => string; noCoords: string; loading: string }> = {
  es: { open: 'Abrir en aplicación de mapas externa', openWeb: 'Abrir en el navegador (iPhone y otros)', address: 'Dirección', directions: 'Cómo llegar', staticAlt: (n) => `Mapa de ${n}`, noCoords: 'Ubicación no disponible.', loading: 'Cargando mapa…' },
  en: { open: 'Open in external maps app', openWeb: 'Open in browser (iPhone and others)', address: 'Address', directions: 'Directions', staticAlt: (n) => `Map of ${n}`, noCoords: 'Location not available.', loading: 'Loading map…' },
  fr: { open: 'Ouvrir dans une application de cartes', openWeb: 'Ouvrir dans le navigateur (iPhone et autres)', address: 'Adresse', directions: 'Itinéraire', staticAlt: (n) => `Carte de ${n}`, noCoords: 'Emplacement indisponible.', loading: 'Chargement de la carte…' },
};

export function validCoords(lat: unknown, lng: unknown): lat is number {
  return (
    typeof lat === 'number' && typeof lng === 'number' &&
    Number.isFinite(lat) && Number.isFinite(lng) &&
    Math.abs(lat) <= 90 && Math.abs(lng) <= 180
  );
}

/** `geo:lat,lng?q=lat,lng(Nombre)` — Android. */
export function buildGeoUri(lat: number, lng: number, label: string): string {
  const safe = label.replace(/[()]/g, '');
  return `geo:${lat},${lng}?q=${lat},${lng}(${encodeURIComponent(safe)})`;
}

/** Enlace https universal: iOS no soporta `geo:`. */
export function buildWebMapUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}

export function MapFallback({
  name, lat, lng, address, directionsText, staticMapSrc,
  locale = 'es', timeoutMs = MAP_TIMEOUT_MS, aspectRatio = '16 / 9', rootMargin = '0px', renderInteractive,
}: MapFallbackProps) {
  const online = useOnlineStatus();
  const hasCoords = validCoords(lat, lng);
  const boxRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<Status>(hasCoords ? 'idle' : 'fallback');
  const { near, supported } = useNearViewport(boxRef, hasCoords && status === 'idle', rootMargin);

  // Sin red, sin coordenadas o sin IntersectionObserver: no se carga el SDK.
  useEffect(() => {
    if ((!hasCoords || !online || !supported) && (status === 'idle' || status === 'loading')) setStatus('fallback');
  }, [hasCoords, online, supported, status]);

  // El usuario llegó a la sección: empieza la carga.
  useEffect(() => {
    if (near && status === 'idle' && online && hasCoords) setStatus('loading');
  }, [near, status, online, hasCoords]);

  // El temporizador de 3000 ms nace al entrar en 'loading', no antes.
  useEffect(() => {
    if (status !== 'loading') return;
    const id = window.setTimeout(() => setStatus((s) => (s === 'loading' ? 'fallback' : s)), timeoutMs);
    return () => window.clearTimeout(id);
  }, [status, timeoutMs]);

  const onReady = useCallback(() => setStatus((s) => (s === 'loading' ? 'ready' : s)), []);
  const onError = useCallback(() => setStatus((s) => (s === 'loading' || s === 'idle' ? 'fallback' : s)), []);

  const t = TEXT[locale];
  const mounted = status === 'loading' || status === 'ready';
  const linkStyle = { display: 'inline-block', minHeight: 48, minWidth: 48, padding: '12px 16px' } as const;

  return (
    <section aria-label={name} data-map-status={status}>
      <div
        ref={boxRef}
        style={{ position: 'relative', width: '100%', aspectRatio, overflow: 'hidden', background: 'var(--color-photo)' }}
        aria-busy={status === 'idle' || status === 'loading'}
      >
        {mounted && <div style={{ position: 'absolute', inset: 0 }}>{renderInteractive({ onReady, onError })}</div>}
        {status === 'idle' && <span style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', fontSize: 14 }}>{t.loading}</span>}
        {status === 'fallback' && (staticMapSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={staticMapSrc} alt={t.staticAlt(name)} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <span style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', fontSize: 14, padding: 8, textAlign: 'center' }}>{name}</span>
        ))}
      </div>
      {address && <p><strong>{t.address}:</strong> {address}</p>}
      {directionsText && <p><strong>{t.directions}:</strong> {directionsText}</p>}
      {hasCoords ? (
        <p>
          <a href={buildGeoUri(lat as number, lng as number, name)} style={linkStyle}>{t.open}</a>
          <a href={buildWebMapUrl(lat as number, lng as number)} target="_blank" rel="noopener noreferrer" style={linkStyle}>{t.openWeb}</a>
        </p>
      ) : (
        <p>{t.noCoords}</p>
      )}
    </section>
  );
}
