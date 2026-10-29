import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CONTENT_STATUSES, ENTITIES, isAdminEntity, STATUS_LABEL } from '../../../../backend/admin-moderation/entities.ts';
import { listEntities } from '../../../../backend/admin-moderation/content-admin.ts';
import { requireAdmin } from '../../../lib/admin.ts';
import { supabaseForRequest } from '../../../lib/supabase-server.ts';
import styles from '../admin.module.css';

type Params = Promise<{ entity: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { entity } = await params;
  return { title: isAdminEntity(entity) ? ENTITIES[entity].plural : 'Panel' };
}

/** Lista de un tipo de contenido, con filtro por estado y búsqueda por título o slug. */
export default async function EntityList({ params, searchParams }: { params: Params; searchParams: Promise<Record<string, string | undefined>> }) {
  const { entity } = await params;
  if (!isAdminEntity(entity)) notFound();
  await requireAdmin(`/admin/${entity}`);
  const { estado, q } = await searchParams;
  const def = ENTITIES[entity];
  const status = (CONTENT_STATUSES as readonly string[]).includes(estado ?? '') ? estado : undefined;
  const items = await listEntities(await supabaseForRequest(), entity, { status, q });
  return (
    <>
      <p className={styles.back}><a href="/admin">← Panel</a></p>
      <h1 className={styles.title}>{def.plural}</h1>
      <form className={styles.filters} method="get">
        <label className={styles.field}><span>Estado</span>
          <select name="estado" defaultValue={status ?? ''}>
            <option value="">Todos</option>
            {CONTENT_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
          </select>
        </label>
        <label className={styles.field}><span>Buscar</span><input name="q" defaultValue={q ?? ''} /></label>
        <button type="submit" className={styles.secondary}>Filtrar</button>
      </form>
      {def.editable && <p><a className={styles.primaryLink} href={`/admin/${entity}/nuevo`}>Nuevo {def.singular}</a></p>}
      {items.length === 0 ? <p className={styles.muted}>No hay {def.plural.toLowerCase()} con ese filtro.</p> : (
        <ul className={styles.list}>
          {items.map((i) => (
            <li key={i.id}>
              <a href={`/admin/${entity}/${i.id}`}>
                <strong>{i.title ?? <em>(sin título en español)</em>}</strong>
                <span>{i.slug}</span>
                <span className={styles[`status_${i.status}`] ?? styles.badge}>{STATUS_LABEL[i.status] ?? i.status}</span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
