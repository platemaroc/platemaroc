import { notFound } from 'next/navigation';
import { ENTITIES, isAdminEntity } from '../../../../../backend/admin-moderation/entities.ts';
import { options } from '../../../../../backend/admin-moderation/content-admin.ts';
import { requireAdmin } from '../../../../lib/admin.ts';
import { supabaseForRequest } from '../../../../lib/supabase-server.ts';
import { AdminForm } from '../../AdminForm.tsx';
import { createEntity } from '../../actions.ts';
import { EntityFields, FIELD_LABELS } from '../../fields.tsx';
import styles from '../../admin.module.css';

export const metadata = { title: 'Nuevo' };

/** Alta: siempre entra en borrador (no visible). Después se añaden traducciones, fotos y relaciones. */
export default async function NewEntity({ params }: { params: Promise<{ entity: string }> }) {
  const { entity } = await params;
  if (!isAdminEntity(entity) || !ENTITIES[entity].editable) notFound();
  await requireAdmin(`/admin/${entity}/nuevo`);
  const db = await supabaseForRequest();
  const [placeTypes, cities, neighborhoods, regions] = await Promise.all([
    entity === 'lugares' ? options(db, 'place_types') : [], ['lugares', 'barrios'].includes(entity) ? options(db, 'ciudades') : [],
    entity === 'lugares' ? options(db, 'barrios') : [], ['ciudades', 'platos'].includes(entity) ? options(db, 'regiones') : [],
  ]);
  const def = ENTITIES[entity];
  return (
    <>
      <p className={styles.back}><a href={`/admin/${entity}`}>← {def.plural}</a></p>
      <h1 className={styles.title}>Nuevo {def.singular}</h1>
      <p className={styles.muted}>Se guarda en borrador: nadie lo ve hasta que lo publiques. Usa solo datos que hayas comprobado.</p>
      <AdminForm action={createEntity} hidden={{ entity }} labels={FIELD_LABELS} submit={`Crear ${def.singular}`}>
        <EntityFields entity={entity} row={null} opts={{ placeTypes, cities, neighborhoods, regions }} slugLocked={false} />
      </AdminForm>
    </>
  );
}
