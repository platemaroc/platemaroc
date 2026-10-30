import type { ReactNode } from 'react';
import styles from './components.module.css';

/** Logo y nombre: la estrella de ocho puntas de los azulejos marroquíes. */
export function Brand({ href, children = <span>Plate<span className={styles.brandAccent}>maroc</span></span> }: { href: string; children?: ReactNode }) {
  return (
    <a className={styles.brand} href={href}>
      <svg className={styles.logo} viewBox="0 0 24 24" aria-hidden="true">
        <rect x="6" y="6" width="12" height="12" fill="currentColor" />
        <rect x="6" y="6" width="12" height="12" fill="currentColor" transform="rotate(45 12 12)" />
        <circle className={styles.logoHole} cx="12" cy="12" r="3" />
      </svg>
      {children}
    </a>
  );
}

/** Cabecera mínima de las pantallas sin barra de idiomas (acceso y cuenta). */
export function BrandBar({ href }: { href: string }) {
  return (
    <header className={styles.headerBar}>
      <div className={styles.header}><Brand href={href} /></div>
    </header>
  );
}
