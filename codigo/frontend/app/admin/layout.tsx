import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { SITE_NAME } from '../../../../seo/types.ts';
import { Brand } from '../../components/Brand.tsx';
import { requireAdmin } from '../../lib/admin.ts';
import { signOut } from '../auth/actions.ts';
import styles from './admin.module.css';

export const metadata: Metadata = { title: { default: 'Panel', template: `%s · Panel · ${SITE_NAME}` }, robots: { index: false, follow: false } };

/** Panel de administración (maestro §2): solo el rol de administración. En español: lo usa el titular. */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await requireAdmin();
  return (
    <div className={styles.frame}>
      <header className={styles.header}>
        <Brand href="/admin">{SITE_NAME} · Panel</Brand>
        <span className={styles.who}>{user.email}</span>
        <form action={signOut}><button type="submit" className={styles.secondary}>Salir</button></form>
      </header>
      <main className={styles.main}>{children}</main>
    </div>
  );
}
