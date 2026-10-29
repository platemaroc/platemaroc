'use client';
import dynamic from 'next/dynamic';
import type { Locale } from '../../shared/locales.ts';
import { MapFallback } from './MapFallback';

// Se descarga solo cuando MapFallback llama a renderInteractive (el usuario llegó a la sección).
const GoogleMapInteractive = dynamic(() => import('./GoogleMapInteractive'), { ssr: false });

/** Mapa de la ficha: carga diferida, 3000 ms desde el inicio de la carga y fallback con dirección e indicaciones (docs/11). */
export function PlaceMap(props: {
  name: string; lat: number | null; lng: number | null; address?: string; directionsText?: string; staticMapSrc?: string; locale: Locale;
}) {
  return (
    <MapFallback
      {...props}
      rootMargin="200px"
      renderInteractive={({ onReady, onError }) => (
        <GoogleMapInteractive lat={props.lat as number} lng={props.lng as number} name={props.name} onReady={onReady} onError={onError} />
      )}
    />
  );
}
