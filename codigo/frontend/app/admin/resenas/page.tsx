import { listReviews } from '../../../../backend/admin-moderation/moderation-admin.ts';
import { STATUS_LABEL } from '../../../../backend/admin-moderation/entities.ts';
import { REJECTION_LABEL, REJECTION_REASONS } from '../../../../backend/reviews/validate.ts';
import { requireAdmin } from '../../../lib/admin.ts';
import { supabaseForRequest } from '../../../lib/supabase-server.ts';
import { AdminForm, ValueButton } from '../AdminForm.tsx';
import { moderateReviewAction, saveReplyAction } from '../actions.ts';
import styles from '../admin.module.css';

export const metadata = { title: 'Reseñas' };

const STATES = ['pendiente', 'aprobada', 'rechazada'];

/** Cola de moderación. Publicar respuestas queda para la Fase 2 (maestro §3): aquí solo borrador y aprobación. */
export default async function Reviews({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireAdmin('/admin/resenas');
  const { estado } = await searchParams;
  const status = STATES.includes(estado ?? '') ? estado! : 'pendiente';
  const reviews = await listReviews(await supabaseForRequest(), status);
  return (
    <>
      <p className={styles.back}><a href="/admin">← Panel</a></p>
      <h1 className={styles.title}>Reseñas</h1>
      <p className={styles.filters}>
        {STATES.map((s) => <a key={s} className={s === status ? styles.primaryLink : styles.secondaryLink} href={`/admin/resenas?estado=${s}`}>{STATUS_LABEL[s]}</a>)}
      </p>
      {reviews.length === 0 && <p className={styles.muted}>No hay reseñas en este estado.</p>}
      {reviews.map((r) => (
        <section key={r.id} className={styles.card}>
          <h2>{r.place}</h2>
          <p className={styles.meta}>
            <span aria-label={`${r.rating}/5`}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
            <span>{r.author}</span><span>{String(r.locale ?? '').toUpperCase()}</span>
            <span>{new Date(r.created_at).toLocaleDateString('es')}</span>
            <span className={styles[`status_${r.status}`]}>{STATUS_LABEL[r.status]}</span>
          </p>
          {r.comment ? <p>{r.comment}</p> : <p className={styles.muted}>(sin comentario)</p>}
          {r.rejection_reason && <p className={styles.muted}>Motivo: {r.rejection_reason}</p>}
          {r.photos.length > 0 && (
            <p className={styles.meta}>
              {r.photos.map((p: Record<string, string>) => p.preview && /* eslint-disable-next-line @next/next/no-img-element */ <img key={p.id} src={p.preview} alt="" width={96} height={72} className={styles.thumb} />)}
              <a href="/admin/fotos">Moderar fotos</a>
            </p>
          )}
          {r.status === 'pendiente' && (
            <AdminForm action={moderateReviewAction} hidden={{ id: r.id }} submit="">
              <label className={styles.field}><span>Motivo (para rechazar)</span>
                <select name="reason" defaultValue="">
                  <option value="">—</option>
                  {REJECTION_REASONS.map((k) => <option key={k} value={k}>{REJECTION_LABEL[k]}</option>)}
                </select>
              </label>
              <label className={styles.field}><span>Detalle (opcional)</span><input name="note" /></label>
              <div className={styles.inline}>
                <ValueButton name="to" value="aprobada">Aprobar</ValueButton>
                <ValueButton name="to" value="rechazada" secondary>Rechazar</ValueButton>
              </div>
            </AdminForm>
          )}
          {r.status !== 'pendiente' && (
            <AdminForm action={moderateReviewAction} hidden={{ id: r.id }} submit="" className={styles.inline}>
              <ValueButton name="to" value="pendiente" secondary>Volver a pendiente</ValueButton>
            </AdminForm>
          )}
          {r.status === 'aprobada' && (
            <details className={styles.locale} open={!!r.reply}>
              <summary>Respuesta {r.reply ? `(${r.reply.status === 'aprobada_por_titular' ? 'aprobada' : 'borrador'})` : ''}</summary>
              <AdminForm action={saveReplyAction} hidden={{ id: r.id }} submit="">
                <label className={styles.field}><span>Texto (mismo idioma que la reseña)</span><textarea name="body" rows={3} defaultValue={r.reply?.body ?? ''} /></label>
                <div className={styles.inline}>
                  <ValueButton name="reply_action" value="borrador" secondary>Guardar borrador</ValueButton>
                  <ValueButton name="reply_action" value="aprobar">Aprobar respuesta</ValueButton>
                </div>
                <small className={styles.muted}>No se publica en esta fase.</small>
              </AdminForm>
            </details>
          )}
        </section>
      ))}
    </>
  );
}
