import type { ReactNode } from 'react';
import { SITE_NAME } from '../../../seo/types.ts';
import styles from './components.module.css';

/** Logo y nombre: un plato visto desde arriba con la estrella de los azulejos marroquíes. Pensado para fondo verde. */
export function Brand({ href, children = SITE_NAME }: { href: string; children?: ReactNode }) {
  return (
    <a className={styles.brand} href={href}>
      <svg className={styles.logo} viewBox="0 0 64 64" aria-hidden="true">
        <circle cx="32" cy="32" r="26" fill="none" stroke="currentColor" strokeWidth="3.5" />
        <path fill="currentColor" d="M32 15l5 7h8l1 8 6 2-6 2-1 8h-8l-5 7-5-7h-8l-1-8-6-2 6-2 1-8h8z" />
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
