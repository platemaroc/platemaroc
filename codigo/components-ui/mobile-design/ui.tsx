import type { ReactNode } from 'react';
import type { Locale } from '../../shared/locales.ts';
import { formatPriceMad } from '../../shared/price.ts';
import styles from './ui.module.css';

/** Valoración: solo con reseñas aprobadas (el dato ya llega filtrado). Sin reseñas no se pinta ninguna estrella. */
export function Stars({ average, count, label, emptyLabel, locale }: { average: number | null; count: number; label: string; emptyLabel: string; locale: Locale }) {
  if (!count || average === null) return <span className={styles.stars}>{emptyLabel}</span>;
  const full = Math.round(average);
  return (
    <span className={styles.stars}>
      <span className={styles.starsIcons} aria-hidden="true">{'★'.repeat(full)}{'☆'.repeat(5 - full)}</span>
      <span>{average.toLocaleString(locale)} · {label}</span>
    </span>
  );
}

/** Precio exclusivamente en MAD (docs/12). Sin importe válido: "Precio pendiente", nunca un número inventado. */
export function Price({ amountMad, locale, pendingLabel }: { amountMad: number | null; locale: Locale; pendingLabel: string }) {
  const text = formatPriceMad(amountMad, locale);
  return text ? <span className={styles.price}>{text}</span> : <span className={styles.pricePending}>{pendingLabel}</span>;
}

/** Foto con espacio reservado. Sin foto, un hueco neutro con texto: nunca una imagen de relleno que parezca real. */
export function Photo({ src, alt, emptyLabel, priority = false }: { src?: string | null; alt?: string; emptyLabel: string; priority?: boolean }) {
  return (
    <div className={styles.photo}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt ?? ''} loading={priority ? 'eager' : 'lazy'} decoding="async" fetchPriority={priority ? 'high' : 'auto'} />
      ) : (
        <span className={styles.photoEmpty}>{emptyLabel}</span>
      )}
    </div>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <p className={styles.empty}>{children}</p>;
}

export function ButtonLink({ href, children }: { href: string; children: ReactNode }) {
  return <a className={styles.button} href={href}>{children}</a>;
}
