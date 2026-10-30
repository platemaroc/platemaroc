import { listPhotos } from '../../../../backend/admin-moderation/moderation-admin.ts';
import { STATUS_LABEL } from '../../../../backend/admin-moderation/entities.ts';
import { LOCALES } from '../../../../shared/locales.ts';
import { requireAdmin } from '../../../lib/admin.ts';
import { supabaseForRequest } from '../../../lib/supabase-server.ts';
import { AdminForm } from '../AdminForm.tsx';
import { moderatePhotoAction } from '../actions.ts';
import { FIELD_LABELS, Text } from '../fields.tsx';
import styles from '../admin.module.css';

export const metadata = { title: 'Fotos' };

const STATES = ['pendiente', 'aprobada', 'rechazada'];

/** Cola de fotos (orden moderar-fotos): origen, autor, licencia y alt. No se aprueba una foto con derechos dudosos. */
export default async function Photos({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireAdmin('/admin/fotos');
  const { estado } = await searchParams;
  const status = STATES.includes(estado ?? '') ? estado! : 'pendiente';
  const photos = await listPhotos(await supabaseForRequest(), status);
  return (
    <>
      <p className={styles.back}><a href="/admin">← Panel</a></p>
      <h1 className={styles.title}>Fotos</h1>
      <p className={styles.filters}>
        {STATES.map((s) => <a key={s} className={s === status ? styles.primaryLink : styles.secondaryLink} href={`/admin/fotos?estado=${s}`}>{STATUS_LABEL[s]}</a>)}
      </p>
      {photos.length === 0 && <p className={styles.muted}>No hay fotos en este estado.</p>}
      {photos.map((p) => (
        <section key={p.id} className={styles.card}>
          <div className={styles.photo}>
            {p.preview && /* eslint-disable-next-line @next/next/no-img-element */ <img src={p.preview} alt="" width={160} height={120} />}
            <p className={styles.meta}><span className={styles[`status_${p.status}`]}>{STATUS_LABEL[p.status]}</span> <span>{p.review_id ? `De una reseña (${String(p.altLocale).toUpperCase()})` : 'Foto de ficha'}</span></p>
            <AdminForm action={moderatePhotoAction} hidden={{ id: p.id }} labels={FIELD_LABELS} submit="Guardar">
              <div className={styles.row3}>
                <Text name="source" value={p.source} />
                <Text name="author" value={p.author} />
                <Text name="license" value={p.license} />
              </div>
              <div className={styles.row3}>
                {LOCALES.map((l) => <Text key={l} name={`alt_${l}`} label={`Texto alternativo (${l})`} value={p.alts?.[l]} hint={l === p.altLocale ? 'Obligatorio para aprobar' : undefined} />)}
              </div>
              <label className={styles.field}><span>Moderación</span>
                <select name="status" defaultValue={p.status}>
                  {STATES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                </select>
              </label>
              <Text name="rejection_reason" value={p.rejection_reason} hint="Obligatorio si la rechazas." />
            </AdminForm>
          </div>
        </section>
      ))}
    </>
  );
}
