import { requireAdmin } from '../../../lib/admin.ts';
import { indexingEnabled } from '../../../lib/seo.ts';
import { supabaseForRequest } from '../../../lib/supabase-server.ts';
import { AdminForm } from '../AdminForm.tsx';
import { recalculate } from '../actions.ts';
import styles from '../admin.module.css';

export const metadata = { title: 'Indexación' };

/** Estado de la indexación. El interruptor es una variable del servidor (SITE_INDEXING_ENABLED): se enciende al lanzar la web. */
export default async function Indexing() {
  await requireAdmin('/admin/indexacion');
  const { count: total } = await (await supabaseForRequest()).from('translations').select('*', { count: 'exact', head: true }).eq('status', 'publicada');
  const { count: yes } = await (await supabaseForRequest()).from('translations').select('*', { count: 'exact', head: true }).eq('is_indexable', true);
  return (
    <>
      <p className={styles.back}><a href="/admin">← Panel</a></p>
      <h1 className={styles.title}>Indexación</h1>
      <p role="status" className={indexingEnabled() ? styles.saved : styles.errors}>
        {indexingEnabled() ? 'Interruptor ENCENDIDO: Google puede indexar lo que pase el Quality Gate.' : 'Interruptor APAGADO: toda la web lleva noindex y robots.txt bloquea a los buscadores.'}
      </p>
      <ul className={styles.counters}>
        <li><strong>{total ?? '—'}</strong><span>Textos publicados</span></li>
        <li><strong>{yes ?? '—'}</strong><span>Indexables (Quality Gate)</span></li>
      </ul>
      <p className={styles.muted}>Se recalcula solo al guardar cambios. Usa este botón de vez en cuando: las verificaciones caducan a los 365 días.</p>
      <AdminForm action={recalculate} hidden={{}} submit="Recalcular ahora"><span /></AdminForm>
    </>
  );
}
